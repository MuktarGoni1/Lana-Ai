"""
db_types.py — Single source of truth for every table and column used by the backend.

WHY THIS FILE EXISTS
Phantom columns (e.g. video_status, video_job_id, video_progress) that don't exist in the
database caused a cascade of 400 errors on every lesson generation attempt.
This file makes it impossible to introduce a column name that doesn't exist:
Type hints and dataclasses enforce valid column usage.

RULE: If a column doesn't appear in this file, you cannot use it anywhere
in the backend. Add it here first, then add a migration, then use it.
"""

from typing import Literal, Optional, List, Dict, Any
from dataclasses import dataclass
from datetime import datetime

# ─── Enums / Literals ─────────────────────────────────────────────────────────

JobStatus = Literal["queued", "processing", "completed", "failed"]
JobErrorCode = Literal[
    "LLM_TIMEOUT",
    "RATE_LIMITED",
    "INVALID_TOPIC",
    "GROQ_ERROR",
    "DB_WRITE_FAILED",
    "MAX_RETRIES_EXCEEDED",
    "UNKNOWN",
]

TopicStatus = Literal["locked", "available", "in_progress", "completed"]
UserRole = Literal["parent", "child"]
KnowledgeLevel = Literal["beginner", "intermediate", "advanced"]
LearningStyle = Literal["visual", "auditory", "reading", "kinesthetic"]
QuizDifficulty = Literal["easy", "medium", "hard"]

# ─── lesson_generation_jobs ──────────────────────────────────────────────────


@dataclass(frozen=True)
class LessonGenerationJob:
    """Exact columns that exist on lesson_generation_jobs."""

    id: str
    user_id: str
    topic_id: str
    status: JobStatus
    error: Optional[str]
    error_code: Optional[JobErrorCode]
    attempts: int
    max_retries: int
    worker_id: Optional[str]
    locked_at: Optional[datetime]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "LessonGenerationJob":
        """Create from Supabase response dict."""
        return cls(
            id=str(data["id"]),
            user_id=str(data["user_id"]),
            topic_id=str(data["topic_id"]),
            status=data["status"],
            error=data.get("error"),
            error_code=data.get("error_code"),
            attempts=data.get("attempts", 0),
            max_retries=data.get("max_retries", 3),
            worker_id=data.get("worker_id"),
            locked_at=_parse_datetime(data.get("locked_at")),
            started_at=_parse_datetime(data.get("started_at")),
            completed_at=_parse_datetime(data.get("completed_at")),
            created_at=_parse_datetime(data["created_at"]) or datetime.now(),
            updated_at=_parse_datetime(data["updated_at"]) or datetime.now(),
        )


# Fields safe to INSERT when creating a new job
NewLessonJob = Dict[Literal["user_id", "topic_id"], str]

# Fields safe to UPDATE when updating a job
JobUpdate = Dict[
    str, Any
]  # Uses only: status, error, error_code, worker_id, locked_at, started_at, completed_at, updated_at

# ─── lesson_units ────────────────────────────────────────────────────────────


@dataclass(frozen=True)
class LessonSection:
    heading: str
    body: str
    examples: List[str]


@dataclass(frozen=True)
class KeyTerm:
    term: str
    definition: str


@dataclass(frozen=True)
class LessonContent:
    title: str
    summary: str
    sections: List[LessonSection]
    key_terms: List[KeyTerm]
    estimated_minutes: int

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "LessonContent":
        """Create from JSON/dict with validation."""
        return cls(
            title=str(data["title"]),
            summary=str(data["summary"]),
            sections=[LessonSection(**s) for s in data.get("sections", [])],
            key_terms=[KeyTerm(**k) for k in data.get("key_terms", [])],
            estimated_minutes=int(data.get("estimated_minutes", 15)),
        )


@dataclass(frozen=True)
class LessonUnit:
    """
    Exact columns that exist on lesson_units.

    ⚠️  NOT in this type (because they DON'T EXIST in the DB schema):
      - video_status    ← phantom column that caused the 400 cascade
      - video_job_id    ← phantom column
      - video_progress  ← phantom column

    The actual video/audio columns are video_ready and audio_ready (booleans).
    """

    id: str
    topic_id: str
    lesson_content: Optional[LessonContent]
    video_url: Optional[str]
    audio_url: Optional[str]
    # TRUE only when lesson_content AND quiz are generated. NOT tied to video.
    is_ready: bool
    # TRUE only when video_url is populated. Independent of is_ready.
    video_ready: bool
    # TRUE only when audio_url is populated. Independent of is_ready.
    audio_ready: bool
    generated_at: Optional[datetime]
    refreshed_at: Optional[datetime]
    created_at: datetime

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "LessonUnit":
        """Create from Supabase response dict."""
        content_data = data.get("lesson_content")
        content = LessonContent.from_dict(content_data) if content_data else None

        return cls(
            id=str(data["id"]),
            topic_id=str(data["topic_id"]),
            lesson_content=content,
            video_url=data.get("video_url"),
            audio_url=data.get("audio_url"),
            is_ready=bool(data.get("is_ready", False)),
            video_ready=bool(data.get("video_ready", False)),
            audio_ready=bool(data.get("audio_ready", False)),
            generated_at=_parse_datetime(data.get("generated_at")),
            refreshed_at=_parse_datetime(data.get("refreshed_at")),
            created_at=_parse_datetime(data["created_at"]) or datetime.now(),
        )


# Fields safe to UPSERT when the generation worker writes lesson content
LessonUnitUpsert = Dict[
    str, Any
]  # Uses only: topic_id, lesson_content, is_ready, generated_at, refreshed_at

# ─── topics ──────────────────────────────────────────────────────────────────


@dataclass(frozen=True)
class Topic:
    id: str
    user_id: str
    term_plan_id: Optional[str]
    subject_name: str
    title: str
    week_number: int
    order_index: int
    status: TopicStatus
    unlocked_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Topic":
        return cls(
            id=str(data["id"]),
            user_id=str(data["user_id"]),
            term_plan_id=str(data["term_plan_id"])
            if data.get("term_plan_id")
            else None,
            subject_name=str(data["subject_name"]),
            title=str(data["title"]),
            week_number=int(data.get("week_number", 1)),
            order_index=int(data.get("order_index", 0)),
            status=data.get("status", "locked"),
            unlocked_at=_parse_datetime(data.get("unlocked_at")),
            completed_at=_parse_datetime(data.get("completed_at")),
            created_at=_parse_datetime(data["created_at"]) or datetime.now(),
            updated_at=_parse_datetime(data["updated_at"]) or datetime.now(),
        )


# ─── profiles ────────────────────────────────────────────────────────────────


@dataclass(frozen=True)
class Profile:
    id: str
    full_name: Optional[str]
    role: Optional[UserRole]
    parent_id: Optional[str]
    age: Optional[int]
    grade: Optional[str]
    diagnostic_completed: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Profile":
        return cls(
            id=str(data["id"]),
            full_name=data.get("full_name"),
            role=data.get("role"),
            parent_id=str(data["parent_id"]) if data.get("parent_id") else None,
            age=data.get("age"),
            grade=data.get("grade"),
            diagnostic_completed=bool(data.get("diagnostic_completed", False)),
            is_active=bool(data.get("is_active", True)),
            created_at=_parse_datetime(data["created_at"]) or datetime.now(),
            updated_at=_parse_datetime(data["updated_at"]) or datetime.now(),
        )


# ─── user_learning_profiles ──────────────────────────────────────────────────


@dataclass(frozen=True)
class LearnerPreferences:
    age: int
    grade: str
    knowledge_level: KnowledgeLevel
    learning_style: LearningStyle
    onboarding_step: int
    onboarding_complete: bool


@dataclass(frozen=True)
class LearningProfile:
    learner_preferences: LearnerPreferences


@dataclass(frozen=True)
class UserLearningProfile:
    user_id: str
    learning_profile: Optional[LearningProfile]
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "UserLearningProfile":
        lp_data = data.get("learning_profile")
        if lp_data and "learner_preferences" in lp_data:
            prefs = LearnerPreferences(**lp_data["learner_preferences"])
            profile = LearningProfile(learner_preferences=prefs)
        else:
            profile = None

        return cls(
            user_id=str(data["user_id"]),
            learning_profile=profile,
            created_at=_parse_datetime(data["created_at"]) or datetime.now(),
            updated_at=_parse_datetime(data["updated_at"]) or datetime.now(),
        )


# ─── quiz_questions ──────────────────────────────────────────────────────────


@dataclass(frozen=True)
class QuizOption:
    label: str  # "A", "B", "C", "D"
    value: str  # The answer text


@dataclass(frozen=True)
class QuizQuestion:
    id: str
    question: str
    options: List[QuizOption]
    correct_answer: str
    explanation: str
    difficulty: QuizDifficulty

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "QuizQuestion":
        return cls(
            id=str(data.get("id", "")),
            question=str(data["question"]),
            options=[QuizOption(**o) for o in data.get("options", [])],
            correct_answer=str(data["correct_answer"]),
            explanation=str(data.get("explanation", "")),
            difficulty=data.get("difficulty", "medium"),
        )


@dataclass(frozen=True)
class QuizQuestionsRow:
    id: str
    topic_id: str
    questions: List[QuizQuestion]
    generated_at: datetime

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "QuizQuestionsRow":
        return cls(
            id=str(data["id"]),
            topic_id=str(data["topic_id"]),
            questions=[QuizQuestion.from_dict(q) for q in data.get("questions", [])],
            generated_at=_parse_datetime(data["generated_at"]) or datetime.now(),
        )


# Fields safe to UPSERT when writing quiz questions
QuizQuestionsUpsert = Dict[str, Any]  # Uses only: topic_id, questions, generated_at


# ─── guardian_reports ────────────────────────────────────────────────────────

ReportType = Literal["weekly", "monthly"]


@dataclass(frozen=True)
class GuardianReport:
    id: str
    user_id: str
    guardian_email: str
    report_type: ReportType
    report_payload: Dict[str, Any]
    period_start: str  # ISO date string
    period_end: str  # ISO date string
    sent: bool
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "GuardianReport":
        return cls(
            id=str(data["id"]),
            user_id=str(data["user_id"]),
            guardian_email=str(data["guardian_email"]),
            report_type=data["report_type"],
            report_payload=data.get("report_payload", {}),
            period_start=str(data["period_start"]),
            period_end=str(data["period_end"]),
            sent=bool(data.get("sent", False)),
            created_at=_parse_datetime(data["created_at"]) or datetime.now(),
            updated_at=_parse_datetime(data["updated_at"]) or datetime.now(),
        )


# ─── guardian_settings ───────────────────────────────────────────────────────


@dataclass(frozen=True)
class GuardianSettings:
    id: str
    email: str
    weekly_report: bool
    monthly_report: bool
    user_id: Optional[str]
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "GuardianSettings":
        return cls(
            id=str(data["id"]),
            email=str(data["email"]),
            weekly_report=bool(data.get("weekly_report", True)),
            monthly_report=bool(data.get("monthly_report", True)),
            user_id=str(data["user_id"]) if data.get("user_id") else None,
            created_at=_parse_datetime(data["created_at"]) or datetime.now(),
            updated_at=_parse_datetime(data["updated_at"]) or datetime.now(),
        )


# ─── Helper functions ────────────────────────────────────────────────────────


def _parse_datetime(value: Any) -> Optional[datetime]:
    """Parse ISO datetime string to datetime object."""
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    try:
        # Handle ISO format with timezone
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except (ValueError, TypeError):
        return None


def get_lesson_unit_columns() -> List[str]:
    """Return valid column names for lesson_units. Use this to validate selects."""
    return [
        "id",
        "topic_id",
        "lesson_content",
        "video_url",
        "audio_url",
        "is_ready",
        "video_ready",
        "audio_ready",
        "generated_at",
        "refreshed_at",
        "created_at",
    ]


def get_job_columns() -> List[str]:
    """Return valid column names for lesson_generation_jobs. Use this to validate selects."""
    return [
        "id",
        "user_id",
        "topic_id",
        "status",
        "error",
        "error_code",
        "attempts",
        "max_retries",
        "worker_id",
        "locked_at",
        "started_at",
        "completed_at",
        "created_at",
        "updated_at",
    ]


# Phantom columns that must NEVER be used (caused production 400 errors)
PHANTOM_COLUMNS = {
    "lesson_units": ["video_status", "video_job_id", "video_progress"],
    "lesson_generation_jobs": [],
}


def validate_columns(table: str, columns: List[str]) -> None:
    """
    Validate that columns exist on a table.
    Raises ValueError if phantom columns are detected.
    """
    if table == "lesson_units":
        valid = set(get_lesson_unit_columns())
        phantom = set(PHANTOM_COLUMNS["lesson_units"])
    elif table == "lesson_generation_jobs":
        valid = set(get_job_columns())
        phantom = set(PHANTOM_COLUMNS["lesson_generation_jobs"])
    else:
        return  # Unknown table, can't validate

    requested = set(columns)

    # Check for phantom columns
    found_phantom = requested & phantom
    if found_phantom:
        raise ValueError(
            f"PHANTOM COLUMN ERROR: {found_phantom} do not exist on {table}. "
            f"These columns caused production 400 errors. "
            f"Valid columns: {valid}"
        )

    # Check for unknown columns
    unknown = requested - valid
    if unknown:
        raise ValueError(
            f"Unknown columns on {table}: {unknown}. Valid columns: {valid}"
        )
