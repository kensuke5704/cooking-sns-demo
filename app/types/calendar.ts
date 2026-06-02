export type Profile = {
    user_id: string;
    name: string | null;
    icon_url: string | null;
  };
  
  export type PairStatus = "loading" | "none" | "pending" | "paired";
  
  export type PairState = {
    status: PairStatus;
    code: string;
    partner: Profile | null;
  };
  
  export type PairPartner = {
    code: string;
    partner: Profile;
  };
  
  export type PairConnection = {
    code: string;
    user1_id: string;
    user2_id: string;
    created_at: string;
  };
  
  export type CodeEntry = {
    code: string;
    created_at: string;
  };
  
  export type CalendarPopupState = {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    onConfirm?: () => void | Promise<void>;
  } | null;
  