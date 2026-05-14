export interface SubjectOption {
  id: string;
  code: string;
  name: string;
}

export interface UploadedBookRecord {
  id: string;
  fileName: string;
  status: 'pending_confirmation' | 'confirmed' | 'processed';
  createdAt: string;
  detectedSubject: {
    code: string;
    confidence: number;
  } | null;
  subjectOptions: SubjectOption[];
}

export interface BookRecord {
  id: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  status: 'pending_confirmation' | 'confirmed' | 'processed';
  createdAt: string;
  detectedSubject: {
    code: string;
    name: string;
    confidence: number;
  } | null;
  confirmedSubject: {
    code: string;
    name: string;
  } | null;
}

export interface NotebookEntry {
  id: string;
  sourceType: 'highlight_auto' | 'manual' | 'paraphrase';
  title: string | null;
  sourceText: string | null;
  noteText: string;
  createdAt: string;
  subject: {
    code: string;
    name: string;
  } | null;
  sourceBook: {
    fileName: string;
  } | null;
}

export interface HighlightPayload {
  pageNumber?: number;
  highlightText: string;
  title?: string;
}

export interface ManualNotePayload {
  subjectCode?: string;
  title?: string;
  sourceText?: string;
  noteText: string;
  examYear?: number;
}

export interface ParaphrasePayload {
  sourceText: string;
  style: 'concise' | 'exam-ready' | 'memory-hook';
  subjectCode?: string;
  sourceEntryId?: string;
}

export interface OfflineBooksOperation {
  id: string;
  createdAt: string;
  operationType: 'manual-note' | 'highlight' | 'paraphrase' | 'confirm-subject';
  payload: Record<string, unknown>;
}
