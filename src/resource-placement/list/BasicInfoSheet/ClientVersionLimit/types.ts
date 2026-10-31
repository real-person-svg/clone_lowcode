export interface VersionLimitItem {
  platform?: string;
  operator?: string;
  version?: string;
}

export interface ClientVersionLimitProps {
  value?: VersionLimitItem[];
  onChange?: (value: VersionLimitItem[]) => void;
  disabled?: boolean;
}
