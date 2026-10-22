-- AlterEnum
ALTER TYPE "StudyLevel" ADD VALUE 'SCHOOL' BEFORE 'FOUNDATION';

-- AlterTable
ALTER TABLE "University" ADD COLUMN     "minGradePercent" DECIMAL(5,2),
ADD COLUMN     "minIelts" DECIMAL(3,1),
ADD COLUMN     "minIeltsBand" DECIMAL(3,1),
ADD COLUMN     "maxStudyGapYears" INTEGER,
ADD COLUMN     "acceptsMoi" BOOLEAN;

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "requiredLevel" "StudyLevel",
ADD COLUMN     "minGradePercent" DECIMAL(5,2),
ADD COLUMN     "minIelts" DECIMAL(3,1),
ADD COLUMN     "minIeltsBand" DECIMAL(3,1),
ADD COLUMN     "maxStudyGapYears" INTEGER,
ADD COLUMN     "acceptsMoi" BOOLEAN;

-- AlterTable
ALTER TABLE "EducationRecord" ADD COLUMN     "grade" DECIMAL(6,2),
ADD COLUMN     "gradeOutOf" DECIMAL(6,2);

-- AlterTable
ALTER TABLE "TestScore" ADD COLUMN     "overall" DECIMAL(5,1),
ADD COLUMN     "lowest" DECIMAL(5,1);

-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "englishMedium" BOOLEAN NOT NULL DEFAULT false;
