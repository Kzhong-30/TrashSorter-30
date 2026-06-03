from typing import Optional, Dict, List, Any
from datetime import datetime
import hashlib
from bson import ObjectId


class MockCollection:
    def __init__(self):
        self._data: Dict[str, dict] = {}
        self._indexes: Dict[str, List] = {}
    
    def find_one(self, query: dict) -> Optional[dict]:
        for doc in self._data.values():
            if self._match(doc, query):
                return doc.copy()
        return None
    
    def find(self, query: dict = None) -> 'MockCursor':
        results = []
        for doc in self._data.values():
            if query is None or self._match(doc, query):
                results.append(doc.copy())
        return MockCursor(results)
    
    def insert_one(self, document: dict) -> 'InsertResult':
        doc_id = document.get('_id') or ObjectId()
        doc = document.copy()
        doc['_id'] = doc_id
        self._data[str(doc_id)] = doc
        return InsertResult(doc_id)
    
    def update_one(self, query: dict, update: dict) -> 'UpdateResult':
        for doc in self._data.values():
            if self._match(doc, query):
                if '$set' in update:
                    doc.update(update['$set'])
                elif '$push' in update:
                    for key, value in update['$push'].items():
                        if key not in doc:
                            doc[key] = []
                        doc[key].append(value)
                return UpdateResult(1)
        return UpdateResult(0)
    
    def delete_one(self, query: dict) -> 'DeleteResult':
        for doc_id, doc in list(self._data.items()):
            if self._match(doc, query):
                del self._data[doc_id]
                return DeleteResult(1)
        return DeleteResult(0)
    
    def count_documents(self, query: dict = None) -> int:
        if query is None:
            return len(self._data)
        count = 0
        for doc in self._data.values():
            if self._match(doc, query):
                count += 1
        return count
    
    async def create_index(self, keys: Any, **kwargs):
        if isinstance(keys, str):
            self._indexes[keys] = []
        elif isinstance(keys, list):
            for key, _ in keys:
                self._indexes[key] = []
    
    def _match(self, doc: dict, query: dict) -> bool:
        for key, value in query.items():
            if key == '_id':
                if doc.get('_id') != value:
                    return False
            elif doc.get(key) != value:
                return False
        return True


class MockCursor:
    def __init__(self, data: List[dict]):
        self._data = data
        self._skip = 0
        self._sort_key = None
        self._sort_order = 1
    
    def sort(self, key: Any, order: int = 1) -> 'MockCursor':
        if isinstance(key, str):
            self._sort_key = key
        elif isinstance(key, list):
            self._sort_key, self._sort_order = key[0]
        self._sort_order = order
        return self
    
    def skip(self, n: int) -> 'MockCursor':
        self._skip = n
        return self
    
    def __aiter__(self):
        return self
    
    async def __anext__(self):
        if not hasattr(self, '_iter_data'):
            data = self._data[self._skip:]
            if self._sort_key:
                data = sorted(data, key=lambda x: x.get(self._sort_key, ''), reverse=(self._sort_order == -1))
            self._iter_data = iter(data)
        try:
            return next(self._iter_data)
        except StopIteration:
            raise StopAsyncIteration
    
    def __iter__(self):
        return iter(self._data)


class InsertResult:
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id


class UpdateResult:
    def __init__(self, modified_count):
        self.modified_count = modified_count


class DeleteResult:
    def __init__(self, deleted_count):
        self.deleted_count = deleted_count


class MockDatabase:
    def __init__(self, name: str):
        self.name = name
        self._collections: Dict[str, MockCollection] = {}
    
    def __getattr__(self, name: str) -> MockCollection:
        if name.startswith('_'):
            raise AttributeError(name)
        if name not in self._collections:
            self._collections[name] = MockCollection()
        return self._collections[name]
    
    def __getitem__(self, name: str) -> MockCollection:
        return getattr(self, name)


class DatabaseManager:
    client: Optional[Any] = None
    db: Optional[MockDatabase] = None
    
    async def connect(self):
        self.db = MockDatabase("survey_platform")
        await self._create_indexes()
        await self._init_demo_data()
        
    async def _create_indexes(self):
        if self.db is None:
            return
        await self.db.surveys.create_index("status")
        await self.db.surveys.create_index("createdAt")
        await self.db.responses.create_index([("surveyId", 1), ("submittedAt", -1)])
        await self.db.responses.create_index([("surveyId", 1), ("ipHash", 1)])
        await self.db.answers.create_index("responseId")
        await self.db.answers.create_index("questionId")
    
    async def _init_demo_data(self):
        if self.db is None:
            return
        if self.db.surveys.count_documents({}) > 0:
            return
        
        demo_survey = {
            "_id": ObjectId("60d21b4667d0d8992e610c85"),
            "title": "2024年度员工满意度调查",
            "description": "感谢您参与本次调查，您的反馈对我们非常重要",
            "welcomeText": "欢迎参加2024年度员工满意度调查！请根据您的实际感受填写问卷。",
            "endText": "感谢您的参与！您的反馈已成功提交。",
            "startTime": datetime(2024, 1, 1, 0, 0, 0),
            "endTime": datetime(2025, 12, 31, 23, 59, 59),
            "maxSubmissions": 1000,
            "isAnonymous": True,
            "status": "published",
            "createdAt": datetime(2024, 1, 15, 10, 0, 0),
            "updatedAt": datetime(2024, 1, 15, 10, 0, 0),
            "questions": [
                {
                    "id": "q1",
                    "type": "single",
                    "title": "您对公司整体工作环境的满意度如何？",
                    "isRequired": True,
                    "options": ["非常满意", "比较满意", "一般", "不太满意", "非常不满意"],
                    "order": 1
                },
                {
                    "id": "q2",
                    "type": "multiple",
                    "title": "您认为公司在以下哪些方面需要改进？（可多选）",
                    "isRequired": False,
                    "options": ["薪资福利", "晋升机会", "培训发展", "团队氛围", "工作与生活平衡", "办公环境"],
                    "order": 2
                },
                {
                    "id": "q3",
                    "type": "dropdown",
                    "title": "您所在的部门是？",
                    "isRequired": True,
                    "options": ["技术研发部", "产品设计部", "市场运营部", "人力资源部", "财务部", "其他"],
                    "order": 3
                },
                {
                    "id": "q4",
                    "type": "rating",
                    "title": "您对直属上级的管理能力评分",
                    "isRequired": True,
                    "scale": 5,
                    "labels": ["1分", "2分", "3分", "4分", "5分"],
                    "order": 4
                },
                {
                    "id": "q5",
                    "type": "matrix",
                    "title": "请对以下各项进行评价",
                    "isRequired": True,
                    "rows": ["工作挑战性", "团队协作", "职业发展", "福利待遇"],
                    "columns": ["非常满意", "比较满意", "一般", "不太满意", "非常不满意"],
                    "order": 5
                },
                {
                    "id": "q6",
                    "type": "text",
                    "title": "您对公司未来发展有什么建议？",
                    "isRequired": False,
                    "placeholder": "请输入您的建议...",
                    "order": 6
                },
                {
                    "id": "q7",
                    "type": "date",
                    "title": "您加入公司的日期是？",
                    "isRequired": True,
                    "order": 7
                },
                {
                    "id": "q8",
                    "type": "scale",
                    "title": "综合来看，您对公司的整体评分是？",
                    "isRequired": True,
                    "minValue": 1,
                    "maxValue": 10,
                    "step": 1,
                    "labels": ["非常不满意", "非常满意"],
                    "order": 8
                }
            ]
        }
        
        self.db.surveys.insert_one(demo_survey)
        
        demo_response1 = {
            "_id": ObjectId("60d21b4667d0d8992e610c86"),
            "surveyId": "60d21b4667d0d8992e610c85",
            "submittedAt": datetime(2024, 1, 16, 9, 30, 0),
            "ipHash": hashlib.sha256(b"192.168.1.1").hexdigest()[:16],
            "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "answers": [
                {"questionId": "q1", "value": "比较满意"},
                {"questionId": "q2", "value": ["薪资福利", "培训发展"]},
                {"questionId": "q3", "value": "技术研发部"},
                {"questionId": "q4", "value": 4},
                {"questionId": "q5", "value": {"工作挑战性": "比较满意", "团队协作": "非常满意", "职业发展": "一般", "福利待遇": "比较满意"}},
                {"questionId": "q6", "value": "希望能有更多的技术分享会"},
                {"questionId": "q7", "value": "2022-03-15"},
                {"questionId": "q8", "value": 8}
            ]
        }
        self.db.responses.insert_one(demo_response1)
        
        demo_response2 = {
            "_id": ObjectId("60d21b4667d0d8992e610c87"),
            "surveyId": "60d21b4667d0d8992e610c85",
            "submittedAt": datetime(2024, 1, 16, 10, 15, 0),
            "ipHash": hashlib.sha256(b"192.168.1.2").hexdigest()[:16],
            "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "answers": [
                {"questionId": "q1", "value": "非常满意"},
                {"questionId": "q2", "value": ["团队氛围", "工作与生活平衡"]},
                {"questionId": "q3", "value": "产品设计部"},
                {"questionId": "q4", "value": 5},
                {"questionId": "q5", "value": {"工作挑战性": "非常满意", "团队协作": "比较满意", "职业发展": "比较满意", "福利待遇": "一般"}},
                {"questionId": "q6", "value": "公司文化很好，继续保持！"},
                {"questionId": "q7", "value": "2021-06-20"},
                {"questionId": "q8", "value": 9}
            ]
        }
        self.db.responses.insert_one(demo_response2)
        
        demo_response3 = {
            "_id": ObjectId("60d21b4667d0d8992e610c88"),
            "surveyId": "60d21b4667d0d8992e610c85",
            "submittedAt": datetime(2024, 1, 17, 14, 0, 0),
            "ipHash": hashlib.sha256(b"192.168.1.3").hexdigest()[:16],
            "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15",
            "answers": [
                {"questionId": "q1", "value": "一般"},
                {"questionId": "q2", "value": ["薪资福利", "晋升机会", "办公环境"]},
                {"questionId": "q3", "value": "市场运营部"},
                {"questionId": "q4", "value": 3},
                {"questionId": "q5", "value": {"工作挑战性": "一般", "团队协作": "一般", "职业发展": "不太满意", "福利待遇": "一般"}},
                {"questionId": "q6", "value": "希望能有更明确的晋升机制"},
                {"questionId": "q7", "value": "2023-01-10"},
                {"questionId": "q8", "value": 5}
            ]
        }
        self.db.responses.insert_one(demo_response3)
        
    async def disconnect(self):
        pass
    
    def get_db(self) -> MockDatabase:
        return self.db


db_manager = DatabaseManager()


async def get_database() -> MockDatabase:
    return db_manager.get_db()
