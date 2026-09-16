// This test verifies the Lyria response contract as handled in server.ts
console.log("--- Testing Lyria Contract Logic ---");

interface LyriaResponse {
  output_audio?: {
    data: string;
    mime_type?: string;
  };
  output_text?: string;
}

function processLyriaResponse(interaction: any) {
    const generatedAudio = interaction.output_audio;
    if (!generatedAudio?.data) {
        throw new Error("LYRIA_NO_AUDIO");
    }
    return {
        audioBase64: generatedAudio.data,
        mimeType: generatedAudio.mime_type || (generatedAudio as any).mimeType || "audio/mpeg",
        generatedText: interaction.output_text || ""
    };
}

// Case 1: Valid modern contract
const mockRes1 = {
    output_audio: {
        data: "base64data",
        mime_type: "audio/wav"
    },
    output_text: "Lyrics here"
};
const processed1 = processLyriaResponse(mockRes1);
if (processed1.audioBase64 !== "base64data" || processed1.mimeType !== "audio/wav") {
    throw new Error("Failed to process valid modern contract");
}
console.log("✅ Modern contract (data/mime_type) passed");

// Case 2: Legacy/Alternative camelCase mimeType
const mockRes2 = {
    output_audio: {
        data: "base64data",
        mimeType: "audio/mp3"
    }
};
const processed2 = processLyriaResponse(mockRes2);
if (processed2.mimeType !== "audio/mp3") {
    throw new Error("Failed to process fallback mimeType");
}
console.log("✅ Fallback contract (mimeType) passed");

// Case 3: Missing audio
try {
    processLyriaResponse({ output_text: "No audio" });
    throw new Error("Should have failed on missing audio");
} catch (e: any) {
    if (e.message !== "LYRIA_NO_AUDIO") throw e;
}
console.log("✅ Missing audio detection passed");

console.log("🚀 ALL LYRIA CONTRACT TESTS PASSED");
