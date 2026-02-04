export interface ClassSessionDTO {
  id: string;
  subjectId: string;
  startTime: Date;
  endTime: Date;
  qrCodeToken?: string;
  isActive: boolean;
  expiresAt?: Date;
}
