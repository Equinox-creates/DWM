export interface DiscordWebhookMessage {
  id?: string; // Internal ID for UI
  content?: string;
  username?: string;
  avatar_url?: string;
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
  name: string;
  value: string;
  inline?: boolean;
}

export const DEFAULT_MESSAGE: DiscordWebhookMessage = {
  content: "Hello, world!",
  username: "Spidey Bot",
  embeds: [
    {
      title: "Welcome to the server!",
      description: "This is a sample embed created with the new DiscoHook Clone.",
      color: 5814783, // #58b9ff
      fields: [
        {
          name: "Getting Started",
          value: "Check out the channels on the left.",
          inline: true,
        },
        {
          name: "Rules",
          value: "Be nice to everyone.",
          inline: true,
        },
      ],
      footer: {
        text: "Ex: Footer Content",
      },
    },
  ],
};
