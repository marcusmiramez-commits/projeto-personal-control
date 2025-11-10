from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
from jwt.exceptions import PyJWTError, DecodeError, InvalidTokenError, ExpiredSignatureError
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
import io
import shutil
from fastapi.responses import StreamingResponse

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Create uploads directory
UPLOAD_DIR = Path("/app/backend/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Mount static files
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"

# ============= MODELS =============

class Professional(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    password_hash: str
    phone: str
    logo_url: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ProfessionalCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str

class ProfessionalLogin(BaseModel):
    email: EmailStr
    password: str

class Student(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    professional_id: str
    name: str
    email: EmailStr
    password_hash: str
    phone: str
    age: Optional[int] = None
    goal: Optional[str] = None
    anamnesis: Optional[str] = None
    observations: Optional[str] = None
    photo_url: Optional[str] = None
    contract_type: str  # "monthly", "prepaid", "postpaid"
    monthly_value: Optional[float] = None
    class_balance: Optional[int] = 0
    class_value: Optional[float] = None
    status: str = "active"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class StudentCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str
    age: Optional[int] = None
    goal: Optional[str] = None
    anamnesis: Optional[str] = None
    observations: Optional[str] = None
    contract_type: str
    monthly_value: Optional[float] = None
    class_balance: Optional[int] = 0
    class_value: Optional[float] = None

class Exercise(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    professional_id: str
    name: str
    category: str  # musculacao, alongamento, mobilidade, domesticos
    muscle_group: str  # músculo alvo
    description: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ExerciseCreate(BaseModel):
    name: str
    category: str
    muscle_group: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None

class ExerciseUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    muscle_group: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None

class Series(BaseModel):
    """Série individual de um exercício"""
    reps: Optional[str] = None
    rest_time: Optional[str] = None
    load: Optional[str] = None
    duration: Optional[str] = None
    observations: Optional[str] = None

class WorkoutExercise(BaseModel):
    exercise_id: str
    exercise_name: str
    sets: Optional[int] = None  # deprecated - usar series
    reps: Optional[str] = None  # deprecated - usar series
    rest_time: Optional[str] = None  # deprecated - usar series
    load: Optional[str] = None  # deprecated - usar series
    duration: Optional[str] = None  # deprecated - usar series
    observations: Optional[str] = None  # deprecated - usar series
    series: Optional[List[Series]] = []  # nova estrutura

# ============= WORKOUT ROUTINE (MACRO) =============

class WorkoutRoutine(BaseModel):
    """Rotina de treino (ex: Musculação, Aeróbico, Funcional)"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    professional_id: str
    student_id: str
    routine_name: str  # "Musculação", "Aeróbico", etc
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class WorkoutRoutineCreate(BaseModel):
    student_id: str
    routine_name: str

class WorkoutRoutineUpdate(BaseModel):
    routine_name: Optional[str] = None

# ============= WORKOUT (TREINO) =============

class Workout(BaseModel):
    """Treino dentro de uma rotina (ex: Treino A - Peito)"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    professional_id: str
    student_id: str
    routine_id: str  # ID da rotina pai
    workout_name: str  # Nome personalizado: "Peito e Ombro", "Inferiores"
    division: str  # Divisão: "A", "B", "Segunda", "Terça", etc
    exercises: List[WorkoutExercise]
    progress_notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class WorkoutCreate(BaseModel):
    student_id: str
    routine_id: str
    workout_name: str
    division: str
    exercises: List[WorkoutExercise]
    progress_notes: Optional[str] = None

class WorkoutUpdate(BaseModel):
    workout_name: Optional[str] = None
    division: Optional[str] = None
    exercises: Optional[List[WorkoutExercise]] = None
    progress_notes: Optional[str] = None

class Schedule(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    professional_id: str
    student_id: str
    student_name: str
    date: str
    time: str
    status: str = "scheduled"  # "scheduled", "completed", "cancelled"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ScheduleCreate(BaseModel):
    student_id: str
    date: str
    time: str

class Attendance(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    professional_id: str
    student_id: str
    student_name: str
    date: str
    present: bool
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class AttendanceCreate(BaseModel):
    student_id: str
    date: str
    present: bool

class Payment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    professional_id: str
    student_id: str
    student_name: str
    amount: float
    payment_date: str
    reference_month: str
    status: str = "paid"  # "paid", "pending"
    payment_method: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PaymentCreate(BaseModel):
    student_id: str
    amount: float
    payment_date: str
    reference_month: str
    payment_method: Optional[str] = None

class Evaluation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    professional_id: str
    student_id: str
    date: str
    weight: Optional[float] = None
    body_fat: Optional[float] = None
    measurements: Optional[dict] = None
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class EvaluationCreate(BaseModel):
    student_id: str
    date: str
    weight: Optional[float] = None
    body_fat: Optional[float] = None
    measurements: Optional[dict] = None
    notes: Optional[str] = None

# ============= AUTH UTILS =============

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        user_type: str = payload.get("type")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return {"id": user_id, "type": user_type}
    except ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except (DecodeError, InvalidTokenError, PyJWTError, Exception) as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

# ============= AUTH ROUTES =============

@api_router.post("/auth/register/professional")
async def register_professional(professional: ProfessionalCreate):
    existing = await db.professionals.find_one({"email": professional.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    prof_obj = Professional(
        name=professional.name,
        email=professional.email,
        password_hash=hash_password(professional.password),
        phone=professional.phone
    )
    doc = prof_obj.model_dump()
    await db.professionals.insert_one(doc)
    
    access_token = create_access_token(data={"sub": prof_obj.id, "type": "professional"})
    return {"access_token": access_token, "token_type": "bearer", "user": {"id": prof_obj.id, "name": prof_obj.name, "email": prof_obj.email, "type": "professional"}}

@api_router.post("/auth/login/professional")
async def login_professional(credentials: ProfessionalLogin):
    prof = await db.professionals.find_one({"email": credentials.email}, {"_id": 0})
    if not prof or not verify_password(credentials.password, prof.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": prof["id"], "type": "professional"})
    return {"access_token": access_token, "token_type": "bearer", "user": {"id": prof["id"], "name": prof["name"], "email": prof["email"], "type": "professional"}}

@api_router.post("/auth/login/student")
async def login_student(credentials: ProfessionalLogin):
    student = await db.students.find_one({"email": credentials.email}, {"_id": 0})
    if not student or not verify_password(credentials.password, student["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": student["id"], "type": "student"})
    return {"access_token": access_token, "token_type": "bearer", "user": {"id": student["id"], "name": student["name"], "email": student["email"], "type": "student", "professional_id": student["professional_id"]}}

# ============= STUDENTS ROUTES =============

@api_router.post("/students", response_model=Student)
async def create_student(student: StudentCreate, current_user: dict = Depends(get_current_user)):
    if current_user["type"] != "professional":
        raise HTTPException(status_code=403, detail="Only professionals can create students")
    
    existing = await db.students.find_one({"email": student.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    student_obj = Student(
        professional_id=current_user["id"],
        name=student.name,
        email=student.email,
        password_hash=hash_password(student.password),
        phone=student.phone,
        age=student.age,
        goal=student.goal,
        anamnesis=student.anamnesis,
        observations=student.observations,
        contract_type=student.contract_type,
        monthly_value=student.monthly_value,
        class_balance=student.class_balance,
        class_value=student.class_value
    )
    doc = student_obj.model_dump()
    await db.students.insert_one(doc)
    return student_obj

@api_router.get("/students", response_model=List[Student])
async def get_students(current_user: dict = Depends(get_current_user)):
    if current_user["type"] == "professional":
        students = await db.students.find({"professional_id": current_user["id"]}, {"_id": 0}).to_list(1000)
    else:
        students = await db.students.find({"id": current_user["id"]}, {"_id": 0}).to_list(1)
    return students

@api_router.get("/students/{student_id}", response_model=Student)
async def get_student(student_id: str, current_user: dict = Depends(get_current_user)):
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    if current_user["type"] == "professional" and student["professional_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    elif current_user["type"] == "student" and student["id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return student

@api_router.put("/students/{student_id}")
async def update_student(student_id: str, updates: dict, current_user: dict = Depends(get_current_user)):
    if current_user["type"] != "professional":
        raise HTTPException(status_code=403, detail="Only professionals can update students")
    
    student = await db.students.find_one({"id": student_id, "professional_id": current_user["id"]}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    if "password" in updates:
        updates["password_hash"] = hash_password(updates.pop("password"))
    
    await db.students.update_one({"id": student_id}, {"$set": updates})
    return {"message": "Student updated successfully"}

@api_router.delete("/students/{student_id}")
async def delete_student(student_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["type"] != "professional":
        raise HTTPException(status_code=403, detail="Only professionals can delete students")
    
    result = await db.students.delete_one({"id": student_id, "professional_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"message": "Student deleted successfully"}

class AddClassesRequest(BaseModel):
    classes: int

class StudentCredentialsUpdate(BaseModel):
    email: Optional[EmailStr] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

@api_router.put("/students/me/credentials")
async def update_student_credentials(updates: StudentCredentialsUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["type"] != "student":
        raise HTTPException(status_code=403, detail="Only students can update their own credentials")
    
    student = await db.students.find_one({"id": current_user["id"]}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    update_data = {}
    
    # Update email if provided
    if updates.email:
        # Check if email is already in use by another student
        existing_student = await db.students.find_one({"email": updates.email, "id": {"$ne": current_user["id"]}}, {"_id": 0})
        if existing_student:
            raise HTTPException(status_code=400, detail="Email já está em uso")
        update_data["email"] = updates.email
    
    # Update password if provided
    if updates.new_password:
        if not updates.current_password:
            raise HTTPException(status_code=400, detail="Senha atual é necessária para alterar a senha")
        
        # Verify current password
        if not verify_password(updates.current_password, student["password_hash"]):
            raise HTTPException(status_code=400, detail="Senha atual incorreta")
        
        # Hash new password
        update_data["password_hash"] = hash_password(updates.new_password)
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhuma atualização fornecida")
    
    await db.students.update_one({"id": current_user["id"]}, {"$set": update_data})
    
    return {"message": "Credenciais atualizadas com sucesso"}

@api_router.post("/students/{student_id}/add-classes")
async def add_classes_to_student(student_id: str, request: AddClassesRequest, current_user: dict = Depends(get_current_user)):
    if current_user["type"] != "professional":
        raise HTTPException(status_code=403, detail="Only professionals can add classes")
    
    if request.classes <= 0:
        raise HTTPException(status_code=400, detail="Number of classes must be positive")
    
    student = await db.students.find_one({"id": student_id, "professional_id": current_user["id"]}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    current_balance = student.get("class_balance", 0)
    new_balance = current_balance + request.classes
    
    await db.students.update_one(
        {"id": student_id},
        {"$set": {"class_balance": new_balance}}
    )
    
    return {
        "message": f"{request.classes} aulas adicionadas com sucesso",
        "previous_balance": current_balance,
        "new_balance": new_balance,
        "classes_added": request.classes
    }

# ============= EXERCISES ROUTES =============

@api_router.post("/exercises", response_model=Exercise)
async def create_exercise(exercise: ExerciseCreate, current_user: dict = Depends(get_current_user)):
    if current_user["type"] != "professional":
        raise HTTPException(status_code=403, detail="Only professionals can create exercises")
    
    exercise_obj = Exercise(
        professional_id=current_user["id"],
        **exercise.model_dump()
    )
    doc = exercise_obj.model_dump()
    await db.exercises.insert_one(doc)
    return exercise_obj

@api_router.get("/exercises", response_model=List[Exercise])
async def get_exercises(current_user: dict = Depends(get_current_user)):
    if current_user["type"] == "professional":
        exercises = await db.exercises.find({"professional_id": current_user["id"]}, {"_id": 0}).to_list(1000)
    else:
        student = await db.students.find_one({"id": current_user["id"]}, {"_id": 0})
        exercises = await db.exercises.find({"professional_id": student["professional_id"]}, {"_id": 0}).to_list(1000)
    return exercises

@api_router.put("/exercises/{exercise_id}", response_model=Exercise)
async def update_exercise(exercise_id: str, exercise_update: ExerciseUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["type"] != "professional":
        raise HTTPException(status_code=403, detail="Only professionals can update exercises")
    
    # Get existing exercise
    existing = await db.exercises.find_one({"id": exercise_id, "professional_id": current_user["id"]}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Exercise not found")
    
    # Update only provided fields
    update_data = {k: v for k, v in exercise_update.model_dump().items() if v is not None}
    
    if update_data:
        await db.exercises.update_one(
            {"id": exercise_id, "professional_id": current_user["id"]},
            {"$set": update_data}
        )
    
    # Return updated exercise
    updated = await db.exercises.find_one({"id": exercise_id}, {"_id": 0})
    return Exercise(**updated)

@api_router.delete("/exercises/{exercise_id}")
async def delete_exercise(exercise_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["type"] != "professional":
        raise HTTPException(status_code=403, detail="Only professionals can delete exercises")
    
    result = await db.exercises.delete_one({"id": exercise_id, "professional_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return {"message": "Exercise deleted successfully"}

@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Upload image or video file"""
    if current_user["type"] != "professional":
        raise HTTPException(status_code=403, detail="Only professionals can upload files")
    
    # Validate file type
    allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/x-msvideo']
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Only images and videos are allowed")
    
    # Generate unique filename
    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Save file
    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")
    
    # Return URL
    file_url = f"/uploads/{unique_filename}"
    return {"url": file_url, "filename": unique_filename}

# ============= WORKOUT ROUTINES ROUTES =============

@api_router.post("/workout-routines", response_model=WorkoutRoutine)
async def create_workout_routine(routine: WorkoutRoutineCreate, current_user: dict = Depends(get_current_user)):
    if current_user["type"] != "professional":
        raise HTTPException(status_code=403, detail="Only professionals can create workout routines")
    
    routine_obj = WorkoutRoutine(
        professional_id=current_user["id"],
        **routine.model_dump()
    )
    doc = routine_obj.model_dump()
    await db.workout_routines.insert_one(doc)
    return routine_obj

@api_router.get("/workout-routines/student/{student_id}")
async def get_student_routines(student_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["type"] == "professional":
        routines = await db.workout_routines.find({"professional_id": current_user["id"], "student_id": student_id}, {"_id": 0}).to_list(1000)
    elif current_user["type"] == "student" and current_user["id"] == student_id:
        routines = await db.workout_routines.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    else:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # For each routine, fetch associated workouts
    for routine in routines:
        workouts = await db.workouts.find({"routine_id": routine["id"]}, {"_id": 0}).to_list(1000)
        routine["workouts"] = workouts
    
    return routines

@api_router.put("/workout-routines/{routine_id}", response_model=WorkoutRoutine)
async def update_workout_routine(routine_id: str, routine_update: WorkoutRoutineUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["type"] != "professional":
        raise HTTPException(status_code=403, detail="Only professionals can update workout routines")
    
    update_data = {k: v for k, v in routine_update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.workout_routines.update_one(
        {"id": routine_id, "professional_id": current_user["id"]},
        {"$set": update_data}
    )
    
    updated = await db.workout_routines.find_one({"id": routine_id}, {"_id": 0})
    return WorkoutRoutine(**updated)

@api_router.delete("/workout-routines/{routine_id}")
async def delete_workout_routine(routine_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["type"] != "professional":
        raise HTTPException(status_code=403, detail="Only professionals can delete workout routines")
    
    # Também deletar todos os workouts dessa rotina
    await db.workouts.delete_many({"routine_id": routine_id, "professional_id": current_user["id"]})
    
    result = await db.workout_routines.delete_one({"id": routine_id, "professional_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Workout routine not found")
    return {"message": "Workout routine and associated workouts deleted successfully"}

# ============= WORKOUTS ROUTES =============

@api_router.post("/workouts", response_model=Workout)
async def create_workout(workout: WorkoutCreate, current_user: dict = Depends(get_current_user)):
    if current_user["type"] != "professional":
        raise HTTPException(status_code=403, detail="Only professionals can create workouts")
    
    workout_obj = Workout(
        professional_id=current_user["id"],
        **workout.model_dump()
    )
    doc = workout_obj.model_dump()
    await db.workouts.insert_one(doc)
    return workout_obj

@api_router.get("/workouts/routine/{routine_id}", response_model=List[Workout])
async def get_routine_workouts(routine_id: str, current_user: dict = Depends(get_current_user)):
    """Get all workouts for a specific routine"""
    if current_user["type"] == "professional":
        workouts = await db.workouts.find({"professional_id": current_user["id"], "routine_id": routine_id}, {"_id": 0}).to_list(1000)
    else:
        # Student access
        workouts = await db.workouts.find({"routine_id": routine_id}, {"_id": 0}).to_list(1000)
    return workouts

@api_router.get("/workouts/student/{student_id}", response_model=List[Workout])
async def get_student_workouts(student_id: str, current_user: dict = Depends(get_current_user)):
    """Get all workouts for a student (legacy endpoint)"""
    if current_user["type"] == "professional":
        workouts = await db.workouts.find({"professional_id": current_user["id"], "student_id": student_id}, {"_id": 0}).to_list(1000)
    elif current_user["type"] == "student" and current_user["id"] == student_id:
        workouts = await db.workouts.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    else:
        raise HTTPException(status_code=403, detail="Access denied")
    return workouts

@api_router.put("/workouts/{workout_id}", response_model=Workout)
async def update_workout(workout_id: str, workout_update: WorkoutUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["type"] != "professional":
        raise HTTPException(status_code=403, detail="Only professionals can update workouts")
    
    update_data = {k: v for k, v in workout_update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.workouts.update_one(
        {"id": workout_id, "professional_id": current_user["id"]},
        {"$set": update_data}
    )
    
    updated = await db.workouts.find_one({"id": workout_id}, {"_id": 0})
    return Workout(**updated)

@api_router.delete("/workouts/{workout_id}")
async def delete_workout(workout_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["type"] != "professional":
        raise HTTPException(status_code=403, detail="Only professionals can delete workouts")
    
    result = await db.workouts.delete_one({"id": workout_id, "professional_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Workout not found")
    return {"message": "Workout deleted successfully"}

# ============= SCHEDULE ROUTES =============

@api_router.post("/schedule", response_model=Schedule)
async def create_schedule(schedule: ScheduleCreate, current_user: dict = Depends(get_current_user)):
    if current_user["type"] != "professional":
        raise HTTPException(status_code=403, detail="Only professionals can create schedules")
    
    student = await db.students.find_one({"id": schedule.student_id}, {"_id": 0})
    if not student or student["professional_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Student not found")
    
    schedule_obj = Schedule(
        professional_id=current_user["id"],
        student_id=schedule.student_id,
        student_name=student["name"],
        date=schedule.date,
        time=schedule.time
    )
    doc = schedule_obj.model_dump()
    await db.schedules.insert_one(doc)
    return schedule_obj

@api_router.get("/schedule", response_model=List[Schedule])
async def get_schedules(date: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if current_user["type"] == "professional":
        query["professional_id"] = current_user["id"]
    else:
        query["student_id"] = current_user["id"]
    
    if date:
        query["date"] = date
    
    schedules = await db.schedules.find(query, {"_id": 0}).to_list(1000)
    return schedules

@api_router.put("/schedule/{schedule_id}")
async def update_schedule(schedule_id: str, updates: dict, current_user: dict = Depends(get_current_user)):
    if current_user["type"] != "professional":
        raise HTTPException(status_code=403, detail="Only professionals can update schedules")
    
    await db.schedules.update_one({"id": schedule_id, "professional_id": current_user["id"]}, {"$set": updates})
    return {"message": "Schedule updated successfully"}

@api_router.delete("/schedule/{schedule_id}")
async def delete_schedule(schedule_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["type"] != "professional":
        raise HTTPException(status_code=403, detail="Only professionals can delete schedules")
    
    result = await db.schedules.delete_one({"id": schedule_id, "professional_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return {"message": "Schedule deleted successfully"}

# ============= DELETE ATTENDANCE =============

@api_router.delete("/attendance/{student_id}/{date}")
async def delete_attendance(student_id: str, date: str, current_user: dict = Depends(get_current_user)):
    if current_user["type"] != "professional":
        raise HTTPException(status_code=403, detail="Only professionals can delete attendance")
    
    result = await db.attendances.delete_one({
        "professional_id": current_user["id"],
        "student_id": student_id,
        "date": date
    })
    
    return {"message": "Attendance deleted successfully", "deleted_count": result.deleted_count}

# ============= ATTENDANCE ROUTES =============

@api_router.post("/attendance", response_model=Attendance)
async def mark_attendance(attendance: AttendanceCreate, current_user: dict = Depends(get_current_user)):
    if current_user["type"] != "professional":
        raise HTTPException(status_code=403, detail="Only professionals can mark attendance")
    
    student = await db.students.find_one({"id": attendance.student_id}, {"_id": 0})
    if not student or student["professional_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Verificar se já existe registro para esta data
    existing = await db.attendances.find_one({
        "professional_id": current_user["id"],
        "student_id": attendance.student_id,
        "date": attendance.date
    }, {"_id": 0})
    
    # Se já existe, atualizar ao invés de inserir
    if existing:
        await db.attendances.update_one(
            {
                "professional_id": current_user["id"],
                "student_id": attendance.student_id,
                "date": attendance.date
            },
            {"$set": {"present": attendance.present}}
        )
        
        attendance_obj = Attendance(
            id=existing["id"],
            professional_id=current_user["id"],
            student_id=attendance.student_id,
            student_name=student["name"],
            date=attendance.date,
            present=attendance.present,
            created_at=existing["created_at"]
        )
        return attendance_obj
    
    # Update class balance if prepaid/postpaid (apenas para novo registro)
    if attendance.present:
        if student["contract_type"] == "prepaid" and student["class_balance"] > 0:
            await db.students.update_one(
                {"id": attendance.student_id},
                {"$inc": {"class_balance": -1}}
            )
    
    # Inserir novo registro
    attendance_obj = Attendance(
        professional_id=current_user["id"],
        student_id=attendance.student_id,
        student_name=student["name"],
        date=attendance.date,
        present=attendance.present
    )
    doc = attendance_obj.model_dump()
    await db.attendances.insert_one(doc)
    return attendance_obj

@api_router.get("/attendance", response_model=List[Attendance])
async def get_attendances(student_id: Optional[str] = None, month: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if current_user["type"] == "professional":
        query["professional_id"] = current_user["id"]
    else:
        query["student_id"] = current_user["id"]
    
    if student_id:
        query["student_id"] = student_id
    
    attendances = await db.attendances.find(query, {"_id": 0}).to_list(1000)
    
    if month:
        attendances = [a for a in attendances if a["date"].startswith(month)]
    
    return attendances

# ============= PAYMENTS ROUTES =============

@api_router.post("/payments")
async def create_payment(payment: PaymentCreate, current_user: dict = Depends(get_current_user)):
    if current_user["type"] != "professional":
        raise HTTPException(status_code=403, detail="Only professionals can create payments")
    
    student = await db.students.find_one({"id": payment.student_id}, {"_id": 0})
    if not student or student["professional_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Student not found")
    
    payment_obj = Payment(
        professional_id=current_user["id"],
        student_id=payment.student_id,
        student_name=student["name"],
        amount=payment.amount,
        payment_date=payment.payment_date,
        reference_month=payment.reference_month,
        payment_method=payment.payment_method
    )
    doc = payment_obj.model_dump()
    await db.payments.insert_one(doc)
    
    # Auto-update class balance for prepaid students
    classes_added = 0
    if student.get("contract_type") == "prepaid" and student.get("class_value") and student.get("class_value") > 0:
        classes_added = int(payment.amount / student["class_value"])
        current_balance = student.get("class_balance", 0)
        new_balance = current_balance + classes_added
        
        await db.students.update_one(
            {"id": payment.student_id},
            {"$set": {"class_balance": new_balance}}
        )
    
    return {
        **payment_obj.model_dump(),
        "classes_added": classes_added,
        "message": f"{classes_added} aulas adicionadas ao saldo" if classes_added > 0 else "Pagamento registrado"
    }

@api_router.get("/payments", response_model=List[Payment])
async def get_payments(student_id: Optional[str] = None, month: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if current_user["type"] == "professional":
        query["professional_id"] = current_user["id"]
    else:
        query["student_id"] = current_user["id"]
    
    if student_id:
        query["student_id"] = student_id
    
    payments = await db.payments.find(query, {"_id": 0}).to_list(1000)
    
    if month:
        payments = [p for p in payments if p["reference_month"] == month]
    
    return payments

# ============= FINANCIAL REPORT ENDPOINT =============

@api_router.get("/financial/report")
async def get_financial_report(month: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    if current_user["type"] != "professional":
        raise HTTPException(status_code=403, detail="Only professionals can view financial reports")
    
    # Get current month if not specified
    if not month:
        from datetime import datetime, timezone
        month = datetime.now(timezone.utc).strftime("%Y-%m")
    
    # Get all students
    students = await db.students.find({"professional_id": current_user["id"], "status": "active"}, {"_id": 0}).to_list(1000)
    
    # Get attendances for the month
    attendances = await db.attendances.find({"professional_id": current_user["id"]}, {"_id": 0}).to_list(10000)
    month_attendances = [a for a in attendances if a["date"].startswith(month) and a["present"]]
    
    # Get payments for the month
    payments = await db.payments.find({"professional_id": current_user["id"], "reference_month": month}, {"_id": 0}).to_list(1000)
    
    # Calculate financial data for each student
    report = []
    total_expected = 0
    total_received = 0
    
    for student in students:
        student_attendances = [a for a in month_attendances if a["student_id"] == student["id"]]
        student_payments = [p for p in payments if p["student_id"] == student["id"]]
        
        classes_count = len(student_attendances)
        paid_amount = sum([p["amount"] for p in student_payments])
        
        # Calculate expected amount based on contract type
        expected_amount = 0
        if student["contract_type"] == "monthly":
            expected_amount = student.get("monthly_value", 0) or 0
        elif student["contract_type"] == "postpaid":
            expected_amount = classes_count * (student.get("class_value", 0) or 0)
        elif student["contract_type"] == "prepaid":
            # For prepaid, expected is based on classes used
            expected_amount = classes_count * (student.get("class_value", 0) or 0)
        
        payment_status = "paid" if paid_amount >= expected_amount else "pending"
        
        report.append({
            "student_id": student["id"],
            "student_name": student["name"],
            "contract_type": student["contract_type"],
            "classes_count": classes_count,
            "expected_amount": expected_amount,
            "paid_amount": paid_amount,
            "balance": paid_amount - expected_amount,
            "payment_status": payment_status,
            "class_value": student.get("class_value", 0),
            "monthly_value": student.get("monthly_value", 0),
            "class_balance": student.get("class_balance", 0)
        })
        
        total_expected += expected_amount
        total_received += paid_amount
    
    return {
        "month": month,
        "total_expected": total_expected,
        "total_received": total_received,
        "total_pending": total_expected - total_received,
        "students": report
    }

# ============= DASHBOARD ROUTES =============

@api_router.get("/dashboard/professional")
async def get_professional_dashboard(current_user: dict = Depends(get_current_user)):
    if current_user["type"] != "professional":
        raise HTTPException(status_code=403, detail="Access denied")
    
    total_students = await db.students.count_documents({"professional_id": current_user["id"], "status": "active"})
    
    today = datetime.now(timezone.utc).date().isoformat()
    today_schedules = await db.schedules.find({"professional_id": current_user["id"], "date": today}, {"_id": 0}).to_list(1000)
    
    current_month = datetime.now(timezone.utc).strftime("%Y-%m")
    month_payments = await db.payments.find({"professional_id": current_user["id"], "reference_month": current_month}, {"_id": 0}).to_list(1000)
    total_revenue = sum([p["amount"] for p in month_payments])
    
    month_attendances = await db.attendances.find({"professional_id": current_user["id"]}, {"_id": 0}).to_list(1000)
    month_attendances = [a for a in month_attendances if a["date"].startswith(current_month)]
    total_classes = len([a for a in month_attendances if a["present"]])
    
    # Calcular taxa de presença
    attendance_rate = 0
    if len(month_attendances) > 0:
        attendance_rate = round((total_classes / len(month_attendances)) * 100, 1)
    
    return {
        "total_students": total_students,
        "today_classes": len(today_schedules),
        "month_revenue": total_revenue,
        "month_classes": total_classes,
        "attendance_rate": attendance_rate
    }

@api_router.get("/dashboard/student")
async def get_student_dashboard(current_user: dict = Depends(get_current_user)):
    if current_user["type"] != "student":
        raise HTTPException(status_code=403, detail="Access denied")
    
    student = await db.students.find_one({"id": current_user["id"]}, {"_id": 0})
    
    today = datetime.now(timezone.utc).date().isoformat()
    next_classes = await db.schedules.find({"student_id": current_user["id"], "date": {"$gte": today}}, {"_id": 0}).sort("date", 1).to_list(5)
    
    current_month = datetime.now(timezone.utc).strftime("%Y-%m")
    month_attendances = await db.attendances.find({"student_id": current_user["id"]}, {"_id": 0}).to_list(1000)
    month_attendances = [a for a in month_attendances if a["date"].startswith(current_month)]
    present_count = len([a for a in month_attendances if a["present"]])
    
    workouts = await db.workouts.find({"student_id": current_user["id"]}, {"_id": 0}).to_list(1000)
    
    return {
        "student": student,
        "next_classes": next_classes,
        "month_attendance": present_count,
        "workouts": workouts
    }

# ============= EVALUATIONS ROUTES =============

@api_router.post("/evaluations", response_model=Evaluation)
async def create_evaluation(evaluation: EvaluationCreate, current_user: dict = Depends(get_current_user)):
    if current_user["type"] != "professional":
        raise HTTPException(status_code=403, detail="Only professionals can create evaluations")
    
    evaluation_obj = Evaluation(
        professional_id=current_user["id"],
        **evaluation.model_dump()
    )
    doc = evaluation_obj.model_dump()
    await db.evaluations.insert_one(doc)
    return evaluation_obj

@api_router.get("/evaluations/student/{student_id}", response_model=List[Evaluation])
async def get_student_evaluations(student_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["type"] == "professional":
        evaluations = await db.evaluations.find({"professional_id": current_user["id"], "student_id": student_id}, {"_id": 0}).to_list(1000)
    elif current_user["type"] == "student" and current_user["id"] == student_id:
        evaluations = await db.evaluations.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    else:
        raise HTTPException(status_code=403, detail="Access denied")
    return evaluations

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()