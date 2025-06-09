// types.ts

export interface WidgetPosition {
  x: number; // px 단위 (relative positioning)
  y: number;
}

export interface WidgetConfig {
  [key: string]: any; // 위젯마다 설정이 다를 수 있으므로 유연하게 설정
}

export interface Widget {
  id: string; // 고유 식별자 (uuid 등)
  type: 'Mood' | 'Quote' | 'Image' | 'Steps' | 'Custom'; // 위젯 타입 (확장 가능)
  position: WidgetPosition;
  config: WidgetConfig;
}
// types.ts (or you can put this directly into FreeformLayout.tsx if you prefer)

export interface LayoutSection {
    id: string;
    type: 'profileCard' | 'about' | 'healthSummary' | 'posts' | 'customText' | 'image' | 'link' | 'socialMedia' | 'calendar' | 'divider' | 'empty';
    position: {
        x: number;
        y: number;
    };
    size?: {
        width: number;
        height: number;
    };
    config?: {
        // Common config properties
        text?: string;
        imageUrl?: string;
        url?: string;
        label?: string;
        color?: string; // for divider

        // Profile Card specific
        nickname?: string;
        joinText?: string;
        followerCount?: number;
        followingCount?: number;

        // Health Summary specific
        data?: { [key: string]: any };

        // Posts specific
        posts?: Array<{
            id: number;
            image_url: string;
            likes: number;
        }>;

        // Social Media specific
        socialLinks?: {
            instagram?: string;
            twitter?: string;
            facebook?: string;
            [key: string]: string | undefined; // Allow other social links
        };
    };
    // Add any other properties needed for specific widget types
}