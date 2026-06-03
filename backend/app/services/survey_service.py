import hashlib
from datetime import datetime
from typing import Optional, Any
from bson import ObjectId


async def get_survey_by_id(db: Any, survey_id: str) -> Optional[dict]:
    try:
        obj_id = ObjectId(survey_id)
        result = db.surveys.find_one({"_id": obj_id})
        if result and hasattr(result, '_id'):
            result["_id"] = str(result["_id"])
        return result
    except:
        return db.surveys.find_one({"_id": survey_id})


async def get_all_surveys(db: Any) -> list:
    surveys = []
    cursor = db.surveys.find()
    for survey in cursor:
        if hasattr(survey, '_id') and isinstance(survey['_id'], ObjectId):
            survey["_id"] = str(survey["_id"])
        surveys.append(survey)
    surveys.sort(key=lambda x: x.get("createdAt", datetime.min), reverse=True)
    return surveys


async def create_survey(db: Any, survey_data: dict) -> dict:
    survey_data["createdAt"] = datetime.utcnow()
    survey_data["updatedAt"] = datetime.utcnow()
    result = db.surveys.insert_one(survey_data)
    survey_data["_id"] = str(result.inserted_id)
    return survey_data


async def update_survey(db: Any, survey_id: str, survey_data: dict) -> Optional[dict]:
    survey_data["updatedAt"] = datetime.utcnow()
    try:
        obj_id = ObjectId(survey_id)
        db.surveys.update_one(
            {"_id": obj_id},
            {"$set": survey_data}
        )
    except:
        db.surveys.update_one(
            {"_id": survey_id},
            {"$set": survey_data}
        )
    return await get_survey_by_id(db, survey_id)


async def delete_survey(db: Any, survey_id: str) -> bool:
    try:
        obj_id = ObjectId(survey_id)
        result = db.surveys.delete_one({"_id": obj_id})
    except:
        result = db.surveys.delete_one({"_id": survey_id})
    return result.deleted_count > 0


async def publish_survey(db: Any, survey_id: str) -> Optional[dict]:
    try:
        obj_id = ObjectId(survey_id)
        db.surveys.update_one(
            {"_id": obj_id},
            {"$set": {"status": "published", "updatedAt": datetime.utcnow()}}
        )
    except:
        db.surveys.update_one(
            {"_id": survey_id},
            {"$set": {"status": "published", "updatedAt": datetime.utcnow()}}
        )
    return await get_survey_by_id(db, survey_id)


async def close_survey(db: Any, survey_id: str) -> Optional[dict]:
    try:
        obj_id = ObjectId(survey_id)
        db.surveys.update_one(
            {"_id": obj_id},
            {"$set": {"status": "closed", "updatedAt": datetime.utcnow()}}
        )
    except:
        db.surveys.update_one(
            {"_id": survey_id},
            {"$set": {"status": "closed", "updatedAt": datetime.utcnow()}}
        )
    return await get_survey_by_id(db, survey_id)


def hash_ip(ip: str) -> str:
    return hashlib.sha256(ip.encode()).hexdigest()[:16]


async def validate_survey_access(db: Any, survey_id: str, ip: str) -> tuple:
    survey = await get_survey_by_id(db, survey_id)
    if not survey:
        return False, "问卷不存在"
    
    if survey.get("status") != "published":
        return False, "问卷未发布"
    
    now = datetime.utcnow()
    if survey.get("startTime") and survey.get("startTime") > now:
        return False, "问卷尚未开始"
    
    if survey.get("endTime") and survey.get("endTime") < now:
        return False, "问卷已结束"
    
    ip_hash = hash_ip(ip)
    existing = db.responses.find_one({
        "surveyId": survey_id,
        "ipHash": ip_hash
    })
    if existing:
        return False, "您已填写过此问卷"
    
    max_responses = survey.get("maxResponses")
    if max_responses:
        count = db.responses.count_documents({"surveyId": survey_id})
        if count >= max_responses:
            return False, "问卷填写人数已达上限"
    
    return True, None


async def create_response(db: Any, survey_id: str, answers: list, ip: str, user_agent: str) -> dict:
    ip_hash = hash_ip(ip)
    response_data = {
        "surveyId": survey_id,
        "answers": answers,
        "submittedAt": datetime.utcnow(),
        "ipHash": ip_hash,
        "userAgent": user_agent
    }
    result = db.responses.insert_one(response_data)
    response_data["_id"] = str(result.inserted_id)
    return response_data


async def get_responses(db: Any, survey_id: str) -> list:
    responses = []
    cursor = db.responses.find({"surveyId": survey_id})
    for response in cursor:
        if hasattr(response, '_id') and isinstance(response['_id'], ObjectId):
            response["_id"] = str(response["_id"])
        responses.append(response)
    responses.sort(key=lambda x: x.get("submittedAt", datetime.min), reverse=True)
    return responses


async def calculate_statistics(db: Any, survey_id: str) -> dict:
    survey = await get_survey_by_id(db, survey_id)
    if not survey:
        return {"totalResponses": 0, "questionStats": []}
    
    responses = await get_responses(db, survey_id)
    total = len(responses)
    
    question_stats = []
    for question in survey.get("questions", []):
        q_id = question.get("id")
        q_type = question.get("type")
        q_title = question.get("title")
        
        answers = []
        for response in responses:
            for answer in response.get("answers", []):
                if answer.get("questionId") == q_id:
                    answers.append(answer.get("value"))
        
        stat = {
            "questionId": q_id,
            "type": q_type,
            "title": q_title,
            "totalAnswers": len(answers),
            "distribution": [],
            "textAnswers": [],
            "average": None
        }
        
        if q_type in ["single", "radio", "dropdown"]:
            counts = {}
            for a in answers:
                if a:
                    label = str(a)
                    options = question.get("options") or []
                    for opt in options:
                        if isinstance(opt, dict):
                            if opt.get("id") == a:
                                label = opt.get("text", a)
                                break
                        elif isinstance(opt, str):
                            if opt == a:
                                label = opt
                                break
                    counts[label] = counts.get(label, 0) + 1
            
            for label, count in counts.items():
                stat["distribution"].append({
                    "label": label,
                    "count": count,
                    "percentage": round(count / total * 100, 1) if total > 0 else 0
                })
        
        elif q_type == "multiple" or q_type == "checkbox":
            all_options = []
            for a in answers:
                if isinstance(a, list):
                    all_options.extend(a)
            
            counts = {}
            for a in all_options:
                label = str(a)
                options = question.get("options") or []
                for opt in options:
                    if isinstance(opt, dict):
                        if opt.get("id") == a:
                            label = opt.get("text", a)
                            break
                    elif isinstance(opt, str):
                        if opt == a:
                            label = opt
                            break
                counts[label] = counts.get(label, 0) + 1
            
            for label, count in counts.items():
                stat["distribution"].append({
                    "label": label,
                    "count": count,
                    "percentage": round(count / total * 100, 1) if total > 0 else 0
                })
        
        elif q_type in ["rating", "scale"]:
            numeric_answers = [int(a) for a in answers if a is not None and str(a).isdigit()]
            if numeric_answers:
                stat["average"] = round(sum(numeric_answers) / len(numeric_answers), 1)
            
            counts = {}
            for a in numeric_answers:
                counts[a] = counts.get(a, 0) + 1
            
            for val in sorted(counts.keys()):
                stat["distribution"].append({
                    "label": str(val),
                    "count": counts[val],
                    "percentage": round(counts[val] / total * 100, 1) if total > 0 else 0
                })
        
        elif q_type == "text":
            stat["textAnswers"] = [a for a in answers if a]
            
            counts = {}
            for a in answers:
                if a:
                    word = str(a)[:10]
                    counts[word] = counts.get(word, 0) + 1
            
            for label, count in sorted(counts.items(), key=lambda x: x[1], reverse=True)[:10]:
                stat["distribution"].append({
                    "label": label,
                    "count": count,
                    "percentage": round(count / total * 100, 1) if total > 0 else 0
                })
        
        elif q_type == "date":
            counts = {}
            for a in answers:
                if a:
                    counts[a] = counts.get(a, 0) + 1
            
            for label, count in counts.items():
                stat["distribution"].append({
                    "label": label,
                    "count": count,
                    "percentage": round(count / total * 100, 1) if total > 0 else 0
                })
        
        elif q_type == "matrix":
            rows = question.get("rows", [])
            cols = question.get("columns", [])
            
            counts = {}
            for a in answers:
                if isinstance(a, dict):
                    for row_name, col_value in a.items():
                        key = f"{row_name} - {col_value}"
                        counts[key] = counts.get(key, 0) + 1
            
            for label, count in counts.items():
                stat["distribution"].append({
                    "label": label,
                    "count": count,
                    "percentage": round(count / total * 100, 1) if total > 0 else 0
                })
        
        question_stats.append(stat)
    
    return {
        "totalResponses": total,
        "questionStats": question_stats
    }
