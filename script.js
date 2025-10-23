const chatBody = document.querySelector(".chat-body");
const messageInput = document.querySelector(".message-input");
const sendMessageButton = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
const fileCancelButton = document.querySelector("#file-cancel");

// ✅ Use your working Gemini API key here
const GEMINI_API_KEY = "AIzaSyA-S8XZPbyR-_Oc-w2cpA8j2fIemfovLqY";

const userData = {
  message: null,
  file: {
    data: null,
    mimeType: null
  }
};

const initialInputHeight = messageInput.scrollHeight;

const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

const generateBotResponse = async (incomingMessageDiv) => {
  const messageElement = incomingMessageDiv.querySelector(".message-text");
  const lowerMessage = userData.message.toLowerCase();

  // === Handle specific queries ===
  if (
    lowerMessage.includes("who are you") ||
    lowerMessage.includes("who r u") ||
    lowerMessage.includes("who r you") ||
    lowerMessage.includes("who are u")
  ) {
    messageElement.innerText =
      "Hey! I’m LessNever AI — a smart assistant created by Kawser Ahmed. Would you like to know more about him?";
    incomingMessageDiv.classList.remove("thinking");
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    return;
  }

  if (
    lowerMessage.includes("yes") ||
    lowerMessage.includes("yeah") ||
    lowerMessage.includes("yeap")
  ) {
    messageElement.innerText =
      "Awesome! I'm LessNever AI, created by Kawser Ahmed — a software engineer who builds modern web apps. Visit his portfolio here: https://ahmed143-9.github.io/Portfolio/";
    incomingMessageDiv.classList.remove("thinking");
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    return;
  }

  // === Prepare API Request ===
  let API_URL;
  let requestBody;

  if (userData.file.data) {
    API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${GEMINI_API_KEY}`;
    requestBody = {
      contents: [
        {
          parts: [
            { text: userData.message || "Please describe this image." },
            {
              inline_data: {
                mime_type: userData.file.mimeType,
                data: userData.file.data
              }
            }
          ]
        }
      ]
    };
  } else {
    API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${GEMINI_API_KEY}`;
    requestBody = {
      contents: [
        {
          parts: [{ text: userData.message }]
        }
      ]
    };
  }

  try {
    console.log("Sending request to Gemini API...");
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);
      let errorMsg = "Something went wrong. Please try again later.";
      if (data.error?.code === 400) errorMsg = "Invalid request or API Key.";
      else if (data.error?.code === 429) errorMsg = "Rate limit exceeded.";
      else if (data.error?.code === 404) errorMsg = "Model not found.";
      messageElement.innerText = errorMsg;
      messageElement.style.color = "#ff0000";
      return;
    }

    const apiResponse =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "Sorry, I couldn't generate a response this time.";

    messageElement.innerText = apiResponse;
    messageElement.style.color = "";
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    messageElement.innerText =
      "Network or API issue. Please try again later.";
    messageElement.style.color = "#ff0000";
  } finally {
    userData.file = { data: null, mimeType: null };
    incomingMessageDiv.classList.remove("thinking");
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
  }
};

// === Handle outgoing messages ===
const handleOutgoingMessage = (e) => {
  e.preventDefault();
  userData.message = messageInput.value.trim();
  if (!userData.message && !userData.file.data) return;

  messageInput.value = "";
  fileUploadWrapper.classList.remove("file-uploaded");
  messageInput.dispatchEvent(new Event("input"));

  const messageContent = `
    <div class="message-text"></div>
    ${
      userData.file.data
        ? `<img src="data:${userData.file.mimeType};base64,${userData.file.data}" class="attachment" />`
        : ""
    }
  `;

  const outgoingMessageDiv = createMessageElement(
    messageContent,
    "user-message"
  );
  outgoingMessageDiv.querySelector(".message-text").textContent =
    userData.message;
  chatBody.appendChild(outgoingMessageDiv);
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });

  // === Show "LessNever AI" Thinking animation ===
  setTimeout(() => {
    const messageContent = `
      <svg class="bot-avatar" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024">
        <path d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9z"></path>
      </svg>
      <div class="message-text">
        <div class="thinking-indicator">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
      </div>`;
    const incomingMessageDiv = createMessageElement(
      messageContent,
      "bot-message",
      "thinking"
    );
    chatBody.appendChild(incomingMessageDiv);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    generateBotResponse(incomingMessageDiv);
  }, 600);
};

// === Event Listeners ===
messageInput.addEventListener("keydown", (e) => {
  const userMessage = e.target.value.trim();
  if (e.key === "Enter" && userMessage && !e.shiftKey) {
    e.preventDefault();
    handleOutgoingMessage(e);
  }
});

messageInput.addEventListener("input", () => {
  messageInput.style.height = `${initialInputHeight}px`;
  messageInput.style.height = `${messageInput.scrollHeight}px`;
  document.querySelector(".chat-form").style.borderRadius =
    messageInput.scrollHeight > initialInputHeight ? "15px" : "32px";
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const previewImage = fileUploadWrapper.querySelector("#imagePreview");
    previewImage.src = e.target.result;
    previewImage.style.display = "block";
    fileUploadWrapper.classList.add("file-uploaded");

    const base64String = e.target.result.split(",")[1];
    userData.file = {
      data: base64String,
      mimeType: file.type
    };

    fileCancelButton.style.display = "block";
  };
  reader.readAsDataURL(file);
});

fileCancelButton.addEventListener("click", () => {
  userData.file = { data: null, mimeType: null };
  fileUploadWrapper.classList.remove("file-uploaded");
  const previewImage = fileUploadWrapper.querySelector("#imagePreview");
  previewImage.src = "";
  previewImage.style.display = "none";
  fileCancelButton.style.display = "none";
  fileInput.value = "";
});

// === Emoji Picker ===
document.addEventListener("DOMContentLoaded", () => {
  if (typeof EmojiMart !== "undefined") {
    try {
      const picker = new EmojiMart.Picker({
        theme: "light",
        skinTonePosition: "none",
        previewPosition: "none",
        onEmojiSelect: (emoji) => {
          const { selectionStart: start, selectionEnd: end } = messageInput;
          messageInput.setRangeText(emoji.native, start, end, "end");
          messageInput.focus();
        }
      });

      document.querySelector(".chat-form").appendChild(picker);

      document.addEventListener("click", (e) => {
        if (e.target.id === "emoji-picker") {
          document.body.classList.toggle("show-emoji-picker");
        } else if (!e.target.closest("em-emoji-picker")) {
          document.body.classList.remove("show-emoji-picker");
        }
      });
    } catch (error) {
      console.warn("Emoji picker failed to load:", error);
    }
  }
});

sendMessageButton.addEventListener("click", (e) => handleOutgoingMessage(e));
document.querySelector("#file-upload").addEventListener("click", () => {
  fileInput.click();
});
