export interface DiscordWebhookMessage {
  id?: string; // Internal ID for UI
  content?: string;
  username?: string;
  avatar_url?: string;
  thread_name?: string;
  applied_tags?: string[];
  forum_mode?: boolean;
  forum_thumbnail_url?: string;
  thread_id?: string;
  tts?: boolean;
  embeds?: DiscordEmbed[];
  components?: DiscordComponent[];
  files?: DiscordFile[];
  // UI-only settings
  auto_reactions?: string[]; // List of emojis
  use_bot_token?: boolean;
  bot_token?: string;
}

export interface DiscordFile {
  id: string;
  name: string;
  file?: File; // Actual file object if selected from disk
  url?: string; // URL if external
  dataUrl?: string; // Preview/Data URL
  size?: number;
  type?: string;
  timestamp?: string;
}

export interface DiscordComponent {
  type: 1; // Action Row
  components: DiscordButton[];
}

export interface DiscordButton {
  type: 2; // Button
  style: 1 | 2 | 3 | 4 | 5; // 5 is Link
  label?: string;
  emoji?: {
    name?: string;
    id?: string;
    animated?: boolean;
  };
  custom_id?: string;
  url?: string;
  disabled?: boolean;
}

export interface DiscordEmbed {
  id?: string;
  title?: string;
  description?: string;
  url?: string;
  color?: number | null; // Integer color
  timestamp?: string; // ISO8601 string
  footer?: {
    text: string;
    icon_url?: string;
  };
  image?: {
    url: string;
  };
  thumbnail?: {
    url: string;
  };
  author?: {
    name: string;
    url?: string;
    icon_url?: string;
  };
  fields?: DiscordEmbedField[];
}

export interface DiscordEmbedField {
  id?: string;
  name: string;
  value: string;
  inline?: boolean;
}

export const DEFAULT_MESSAGE: DiscordWebhookMessage = {
  id: "default-msg",
  content: "Hello ! I'm Captain Hook.!",
  username: "Captain Hook",
  embeds: [
    {
      id: "default-embed",
      title: "Welcome, You can Now Edit Send And Also Almost everything!",
      description: "This is a sample embed , Discord webhooks are have some limitations, and one of thame is the Embeds, A Webhook Can Send Max 10 Embeds In par Massege, Silect Continue To Break the limit !",
      color: 5814783, // #58b9ff
      fields: [
        {
          id: "default-field-1",
          name: "Let's Get Started-",
          value: "Check out the channels on the left. Use the Menue at the header or in the settings To change the Editor Type for More Better Editing",
          inline: false,
        },
        {
          id: "default-field-2",
          name: "Max limits of Discord Webhooks-",
          value: "Sorry, But We Can not Do Anything Aboute it, it's all about webhooks of discord, Thay have added Some Limits, But Nothing To Worry, You Can Breack The limits By our Systeme- The Critical LimitsFeatureLimitMax Embeds10 per messageTotal Characters6,000 (combined across all 10 embeds)Fields per Embed25 fieldsDescription Length4,096 characters (per individual embed)Title Length256 characters.",
          inline: false,
        },
      ],
      footer: {
        text: "A Short Guide From us",
      },
    },
  ],
};
