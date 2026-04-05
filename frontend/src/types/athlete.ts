export interface Athlete {
  id: string;
  clubId: string;
  fullName: string;
  position: string;
  birthDate: string | null;
  externalId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AthleteFormValues {
  fullName: string;
  position: string;
  birthDate: string;
  externalId: string;
}

export interface AthletePayload {
  fullName: string;
  position: string;
  birthDate?: string | null;
  externalId?: string | null;
}

export interface AthleteUpdatePayload {
  fullName?: string;
  position?: string;
  birthDate?: string | null;
  externalId?: string | null;
}
