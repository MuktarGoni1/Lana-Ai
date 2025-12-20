// src/components/home/chat-interface.stories.tsx
// Storybook stories for visual testing

import React, { useState } from "react";
import { Meta, StoryFn } from "@storybook/react";
import { ChatInterface } from "./chat-interface";

export default {
  title: "Components/Home/ChatInterface",
  component: ChatInterface,
  parameters: {
    layout: "fullscreen",
  },
} as Meta<typeof ChatInterface>;

const Template: StoryFn<typeof ChatInterface> = (args) => {
  const [value, setValue] = useState(args.value || "");
  const [showCommandPalette, setShowCommandPalette] = useState(args.showCommandPalette || false);
  const [activeSuggestion, setActiveSuggestion] = useState(args.activeSuggestion || -1);
  const [attachments, setAttachments] = useState(args.attachments || []);

  return (
    <ChatInterface
      {...args}
      value={value}
      setValue={setValue}
      showCommandPalette={showCommandPalette}
      setShowCommandPalette={setShowCommandPalette}
      activeSuggestion={activeSuggestion}
      setActiveSuggestion={setActiveSuggestion}
      attachments={attachments}
      handleSendMessage={() => {}}
      handleAttachFile={() => {}}
      removeAttachment={() => {}}
      onNavigateToVideoLearning={() => {}}
      setError={() => {}}
    />
  );
};

export const Default = Template.bind({});
Default.args = {
  value: "",
  isTyping: false,
  showCommandPalette: false,
  activeSuggestion: -1,
  lessonJson: null,
  error: null,
  saveMessage: null,
  showSaveMessage: false,
  attachments: [],
};

export const WithText = Template.bind({});
WithText.args = {
  ...Default.args,
  value: "Explain quantum physics",
};

export const Typing = Template.bind({});
Typing.args = {
  ...Default.args,
  value: "Explain quantum physics",
  isTyping: true,
};

export const WithError = Template.bind({});
WithError.args = {
  ...Default.args,
  value: "Explain quantum physics",
  error: "Something went wrong. Please try again.",
};

export const WithAttachments = Template.bind({});
WithAttachments.args = {
  ...Default.args,
  value: "Explain quantum physics",
  attachments: ["document.pdf", "image.png"],
};

export const WithCommandPalette = Template.bind({});
WithCommandPalette.args = {
  ...Default.args,
  value: "/",
  showCommandPalette: true,
  activeSuggestion: 0,
};