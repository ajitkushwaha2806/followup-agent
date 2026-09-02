import { safeParseModelJson } from "@/lib/json-parser";
import { getBedrockClient } from "@/lib/bedrock/client";
import { ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

function generateFallbackEmail({ restaurant, merchantUser, emailType, tone, customNotes }) {
    const resName = restaurant?.name || "Our Restaurant";
    const resId = restaurant?.resId || "N/A";
    const resAddress = restaurant?.resAddress || "N/A";

    const approvedSteps = (restaurant?.steps || [])
        .filter((s) => s.status === "APPROVED")
        .map((s) => s.title);

    const pendingSteps = (restaurant?.steps || [])
        .filter((s) => s.status !== "APPROVED")
        .map((s) => s.title);

    let stageProgressText = "";
    if (approvedSteps.length > 0 && pendingSteps.length > 0) {
        stageProgressText = `My ${approvedSteps.join(", ")} have already been approved. However, the ${pendingSteps.join(" and ")} section is currently showing “Under Review”.`;
    } else if (pendingSteps.length > 0) {
        stageProgressText = `The ${pendingSteps.join(" and ")} section is currently showing “Under Review”.`;
    } else {
        stageProgressText = "All onboarding sections have been submitted and are awaiting final activation.";
    }

    const pendingTarget = pendingSteps.length > 0 ? `pending ${pendingSteps.join(" and ")}` : "onboarding stages";

    const subject = `Request for Restaurant Account Review & Activation - ${resName} (ID: ${resId})`;

    const body = `Dear Zomato Support Team,

I would like to request you to kindly review and activate my restaurant account on Zomato.

Restaurant Name: ${resName}
Restaurant ID: ${resId}
Address: ${resAddress}

${stageProgressText}

Kindly review and approve the ${pendingTarget} at the earliest and complete the verification process so that my restaurant account can be activated and made live on Zomato.
${customNotes ? `\nAdditional Note: ${customNotes}\n` : ""}
I have attached a screenshot for your reference. Please let me know if any additional information or action is required from my side.

Thank you for your support.

Regards,
${resName}
Restaurant ID: ${resId}`;

    return {
        success: true,
        subject,
        body,
        summary: `Follow-up request to activate ${resName} (ID: ${resId}) and approve pending stages.`,
        isFallback: true,
    };
}

export async function generateFollowupEmail({
    restaurant,
    merchantUser = null,
    emailType = "ONBOARDING_FOLLOWUP",
    tone = "Polite, professional, short, concise, and urgent escalation",
    customNotes = "",
}) {
    if (!restaurant) {
        throw new Error("Restaurant data is required for email generation");
    }

    const resName = restaurant.name || "Restaurant";
    const resId = restaurant.resId || "N/A";
    const resAddress = restaurant.resAddress || "N/A";
    const kitchenType = restaurant.kitchenType || "Cloud Kitchen / Dine-in";
    const listingStatus = restaurant.resListingStatus || "UNDER REVIEW";

    const pendingSteps = (restaurant.steps || [])
        .filter((step) => step.status !== "APPROVED")
        .map(
            (s) =>
                `- ${s.title} (Status: ${s.message?.[0] || s.status}): ${s.description || ""}`
        )
        .join("\n");

    const approvedSteps = (restaurant.steps || [])
        .filter((step) => step.status === "APPROVED")
        .map((s) => s.title)
        .join(", ");

    const systemPrompt = `
You are an expert executive communications assistant for restaurant partners communicating with Zomato Merchant Support & Onboarding teams.

Your goal is to write a clean, polite, direct, concise, and urgent follow-up email to expedite restaurant onboarding review and activate the account.

Tone: Polite, highly professional, short, concise, and urgent escalation.
Email category: ${emailType}

Strict Formatting Template:
Dear Zomato Support Team,

I would like to request you to kindly review and activate my restaurant account on Zomato.

Restaurant Name: [Restaurant Name]
Restaurant ID: [Restaurant ID]
Address: [Restaurant Address]

My [Approved Stages list] have already been approved. However, the [Pending Stages list] section is currently showing “Under Review”.

Kindly review and approve the pending [Pending Stages] at the earliest and complete the verification process so that my restaurant account can be activated and made live on Zomato.

[If user provided additional notes, mention them concisely here].

I have attached a screenshot for your reference. Please let me know if any additional information or action is required from my side.

Thank you for your support.

Regards,
[Restaurant Name]
Restaurant ID: [Restaurant ID]

Output Rules:
1. Return ONLY valid JSON object with keys: "subject", "body", "summary".
2. Do NOT include markdown ticks (\`\`\`) or explanations outside JSON.
3. Keep the subject line clear: "Request for Restaurant Account Review & Activation - ${resName} (ID: ${resId})".
`;

    const prompt = `
Generate the follow-up email for:

Restaurant Details:
- Name: ${resName}
- Restaurant ID: ${resId}
- Address: ${resAddress}
- Kitchen Type: ${kitchenType}
- Listing Status: ${listingStatus}

Approved Stages:
${approvedSteps || "None"}

Pending Stages:
${pendingSteps || "All submitted stages under review"}

Merchant Contact:
- Person: ${merchantUser?.name || resName}
- Phone: ${merchantUser?.mobile || ""}

Custom Merchant Instructions:
${customNotes ? customNotes : "None"}

Format expected:
{
  "subject": "Request for Restaurant Account Review & Activation - ${resName} (ID: ${resId})",
  "body": "Dear Zomato Support Team,\\n\\nI would like to request you to kindly review and activate my restaurant account on Zomato.\\n\\nRestaurant Name: ${resName}\\nRestaurant ID: ${resId}\\nAddress: ${resAddress}\\n\\n...",
  "summary": "Request to activate restaurant account and unblock pending review stages"
}
`;

    const modelId = process.env.BEDROCK_MODEL_ID || "amazon.nova-lite-v1:0";

    try {
        const client = getBedrockClient();
        const command = new ConverseCommand({
            modelId,
            system: [
                {
                    text: systemPrompt,
                },
            ],
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            text: prompt,
                        },
                    ],
                },
            ],
            inferenceConfig: {
                maxTokens: 2500,
                temperature: 0.2,
            },
        });

        const response = await client.send(command);
        const content = response?.output?.message?.content || [];
        const rawText = content.map((block) => block.text || "").join("\n");

        const parsed = safeParseModelJson(rawText);

        if (parsed && parsed.subject && parsed.body) {
            return {
                success: true,
                subject: parsed.subject,
                body: parsed.body,
                summary: parsed.summary || `Follow-up email generated for ${resName}.`,
                restaurantId: resId,
                restaurantName: resName,
                recipientEmail: "merchantonboarding@zomato.com",
                modelUsed: modelId,
                generatedAt: new Date().toISOString(),
            };
        }

        if (rawText && rawText.trim().length > 20) {
            return {
                success: true,
                subject: `Request for Restaurant Account Review & Activation - ${resName} (ID: ${resId})`,
                body: rawText.replace(/```json/gi, "").replace(/```/g, "").trim(),
                summary: `Generated follow-up email for ${resName}.`,
                restaurantId: resId,
                restaurantName: resName,
                recipientEmail: "merchantonboarding@zomato.com",
                modelUsed: modelId,
                generatedAt: new Date().toISOString(),
            };
        }

        return generateFallbackEmail({ restaurant, merchantUser, emailType, tone, customNotes });
    } catch (error) {
        console.warn("Bedrock API call failed or credentials not configured for Bedrock. Generating high-quality template fallback:", error.message);
        const fallback = generateFallbackEmail({ restaurant, merchantUser, emailType, tone, customNotes });
        return {
            ...fallback,
            restaurantId: resId,
            restaurantName: resName,
            recipientEmail: "merchantonboarding@zomato.com",
            generatedAt: new Date().toISOString(),
            note: "Generated using built-in executive template.",
        };
    }
}