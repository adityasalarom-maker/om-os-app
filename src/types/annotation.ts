export type AnnotationIntent = 'BUG' | 'LAYOUT' | 'THEME' | 'FEATURE' | 'REFACTOR' | 'CLARIFY';

export type AnnotationTargetType = 'element' | 'region' | 'text';

export type AnnotationStatus = 'pending' | 'resolved' | 'dismissed';

export interface BoundingBox {
  top: number;
  left: number;
  width: number;
  height: number;
  pageX?: number;
  pageY?: number;
}

export interface NormalizedBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnnotationTarget {
  type: AnnotationTargetType;
  canonicalId?: string; // from data-ag-id
  tag: string;
  selector: string;
  rect: BoundingBox;
  normalizedRect?: NormalizedBox;
  domPathSummary?: string[];
  componentHint?: string;
  textSnippet?: string;
}

export interface AnnotationComment {
  intent: AnnotationIntent;
  userText: string;
}

export interface AnnotationRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: AnnotationStatus;
  target: AnnotationTarget;
  comment: AnnotationComment;
  page: {
    url: string;
    route: string;
    title: string;
    viewport: {
      width: number;
      height: number;
      scrollX: number;
      scrollY: number;
      dpr: number;
    };
  };
}
