import {
  BookOpen,
  Circle,
  FileText,
  FlaskConical,
  FolderKanban,
  ListChecks,
  NotebookPen,
  Presentation,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { ItemType } from "@/lib/forecast/types";

export const TYPE_ICON: Record<ItemType, LucideIcon> = {
  exam: NotebookPen,
  quiz: ListChecks,
  paper: FileText,
  project: FolderKanban,
  presentation: Presentation,
  homework: BookOpen,
  lab: FlaskConical,
  participation: Users,
  other: Circle,
};
