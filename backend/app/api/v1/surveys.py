from fastapi import APIRouter, Depends, HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List
from app.core.database import get_database
from app.schemas import (
    SurveyCreate,
    SurveyUpdate,
    Survey,
    SurveyResponseCreate,
    SurveyResponse,
    Statistics,
    ValidationResult,
)
from app.services import (
    get_survey_by_id,
    get_all_surveys,
    create_survey,
    update_survey,
    delete_survey,
    publish_survey,
    close_survey,
    validate_survey_access,
    create_response,
    get_responses,
    calculate_statistics,
)

router = APIRouter(prefix="/api/surveys", tags=["问卷管理"])


def survey_to_response(survey: dict) -> dict:
    if survey:
        survey["_id"] = str(survey["_id"])
    return survey


@router.get("", response_model=List[dict])
async def list_surveys(db: AsyncIOMotorDatabase = Depends(get_database)):
    surveys = await get_all_surveys(db)
    return [survey_to_response(s) for s in surveys]


@router.post("", response_model=dict)
async def create_new_survey(
    survey: SurveyCreate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    survey_data = survey.model_dump()
    survey_data["status"] = "draft"
    result = await create_survey(db, survey_data)
    return survey_to_response(result)


@router.get("/{survey_id}", response_model=dict)
async def get_survey(
    survey_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    survey = await get_survey_by_id(db, survey_id)
    if not survey:
        raise HTTPException(status_code=404, detail="问卷不存在")
    return survey_to_response(survey)


@router.put("/{survey_id}", response_model=dict)
async def update_existing_survey(
    survey_id: str,
    survey: SurveyUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    existing = await get_survey_by_id(db, survey_id)
    if not existing:
        raise HTTPException(status_code=404, detail="问卷不存在")
    
    survey_data = survey.model_dump(exclude_unset=True)
    result = await update_survey(db, survey_id, survey_data)
    return survey_to_response(result)


@router.delete("/{survey_id}")
async def delete_existing_survey(
    survey_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    existing = await get_survey_by_id(db, survey_id)
    if not existing:
        raise HTTPException(status_code=404, detail="问卷不存在")
    
    await delete_survey(db, survey_id)
    return {"message": "删除成功"}


@router.post("/{survey_id}/publish", response_model=dict)
async def publish_existing_survey(
    survey_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    existing = await get_survey_by_id(db, survey_id)
    if not existing:
        raise HTTPException(status_code=404, detail="问卷不存在")
    
    if existing.get("questions", []).__len__() == 0:
        raise HTTPException(status_code=400, detail="请先添加题目后再发布")
    
    result = await publish_survey(db, survey_id)
    return survey_to_response(result)


@router.post("/{survey_id}/close", response_model=dict)
async def close_existing_survey(
    survey_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    existing = await get_survey_by_id(db, survey_id)
    if not existing:
        raise HTTPException(status_code=404, detail="问卷不存在")
    
    result = await close_survey(db, survey_id)
    return survey_to_response(result)


@router.post("/{survey_id}/validate", response_model=ValidationResult)
async def validate_survey(
    survey_id: str,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    ip = request.client.host if request.client else "unknown"
    can_fill, reason = await validate_survey_access(db, survey_id, ip)
    return ValidationResult(canFill=can_fill, reason=reason)


@router.post("/{survey_id}/responses", response_model=dict)
async def submit_survey_response(
    survey_id: str,
    response: SurveyResponseCreate,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "")
    
    can_fill, reason = await validate_survey_access(db, survey_id, ip)
    if not can_fill:
        raise HTTPException(status_code=400, detail=reason)
    
    answers_data = [a.model_dump() for a in response.answers]
    result = await create_response(db, survey_id, answers_data, ip, user_agent)
    return survey_to_response(result)


@router.get("/{survey_id}/responses", response_model=List[dict])
async def list_survey_responses(
    survey_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    existing = await get_survey_by_id(db, survey_id)
    if not existing:
        raise HTTPException(status_code=404, detail="问卷不存在")
    
    responses = await get_responses(db, survey_id)
    return [survey_to_response(r) for r in responses]


@router.get("/{survey_id}/statistics", response_model=Statistics)
async def get_survey_statistics(
    survey_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    existing = await get_survey_by_id(db, survey_id)
    if not existing:
        raise HTTPException(status_code=404, detail="问卷不存在")
    
    stats = await calculate_statistics(db, survey_id)
    return stats
