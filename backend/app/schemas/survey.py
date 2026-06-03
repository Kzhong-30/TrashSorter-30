from pydantic import BaseModel, Field
from typing import Optional, List, Union
from datetime import datetime
from enum import Enum


class QuestionType(str, Enum):
    RADIO = "radio"
    CHECKBOX = "checkbox"
    DROPDOWN = "dropdown"
    RATING = "rating"
    SCALE = "scale"
    TEXT = "text"
    DATE = "date"
    MATRIX = "matrix"


class SurveyStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    CLOSED = "closed"


class Option(BaseModel):
    id: str
    text: str
    jumpTo: Optional[int] = None


class LogicRule(BaseModel):
    condition: str
    action: str
    target: Union[int, str]


class QuestionSettings(BaseModel):
    placeholder: Optional[str] = None
    rows: Optional[int] = None
    maxLength: Optional[int] = None
    minRating: Optional[int] = None
    maxRating: Optional[int] = None
    minValue: Optional[int] = None
    maxValue: Optional[int] = None
    step: Optional[int] = None
    minSelect: Optional[int] = None
    maxSelect: Optional[int] = None
    format: Optional[str] = None
    matrixRows: Optional[List[str]] = None
    matrixCols: Optional[List[str]] = None
    ratingLabels: Optional[List[str]] = None


class Question(BaseModel):
    id: str
    type: QuestionType
    title: str
    description: Optional[str] = None
    required: bool = False
    options: Optional[List[Option]] = None
    settings: QuestionSettings = Field(default_factory=QuestionSettings)
    logic: Optional[List[LogicRule]] = None


class SurveyBase(BaseModel):
    title: str = "未命名问卷"
    description: str = ""
    welcomeMessage: str = "欢迎参加本次问卷调查"
    endMessage: str = "感谢您的参与！"
    startTime: Optional[datetime] = None
    endTime: Optional[datetime] = None
    maxResponses: Optional[int] = None
    isAnonymous: bool = True
    status: SurveyStatus = SurveyStatus.DRAFT
    questions: List[Question] = []


class SurveyCreate(SurveyBase):
    pass


class SurveyUpdate(SurveyBase):
    pass


class Survey(SurveyBase):
    id: Optional[str] = Field(None, alias="_id")
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        populate_by_name = True


class AnswerValue(BaseModel):
    questionId: str
    value: Union[str, List[str], int, None]


class SurveyResponseCreate(BaseModel):
    answers: List[AnswerValue]


class SurveyResponse(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    surveyId: str
    answers: List[AnswerValue]
    submittedAt: Optional[datetime] = None
    ipHash: Optional[str] = None
    userAgent: Optional[str] = None

    class Config:
        populate_by_name = True


class QuestionStatistics(BaseModel):
    questionId: str
    type: str
    title: str
    totalAnswers: int = 0
    distribution: List[dict] = []
    textAnswers: Optional[List[str]] = None
    average: Optional[float] = None


class Statistics(BaseModel):
    totalResponses: int = 0
    questionStats: List[QuestionStatistics] = []


class ValidationResult(BaseModel):
    canFill: bool = True
    reason: Optional[str] = None
