// app/context/AuthContext.ts
import { createContext } from "react";
import { User } from "@/types/user";

export type AccountType = "admin" | "employer" | "jobseeker";

export interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signUp: (
    email: string,
    password: string,
    name: string,
    accountType: AccountType,
    extraData?: {
      companyName?: string;
      companyDescription?: string;
      companyLocation?: string;
      selectedCategories?: string[];
      homeLocation?: string;
      travelDistance?: number;
      uploadedDocuments?: File[];
      documentTypes?: string[];
      verificationNotes?: string;
    },
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  changeName: (newName: string) => Promise<boolean>;
  changePassword: (newPassword: string) => Promise<boolean>;
  forgetPassword: (email: string) => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType | null>(null);
