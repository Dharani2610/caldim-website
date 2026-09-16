import { NextResponse } from "next/server";
import {
  getContactSubmissionsCollection,
  getMediaAssetsCollection,
  isDatabaseConfigured,
  newId,
} from "@/backend/db";
import {
  isEmailConfigured,
  sendRfqAutoConfirmation,
  sendRfqNotification,
  type RfqMailData,
} from "@/backend/email/mailer";
import { audit } from "@/backend/security/audit";
import { hashIp } from "@/backend/security/crypto";
import { guardPublic, jsonError, jsonOk } from "@/backend/security/guard";
import { RULES } from "@/backend/security/rateLimit";
import { clientIp, clientUserAgent } from "@/backend/security/session";
import { UploadError, storeDocumentUpload } from "@/backend/security/upload";
import { contactSchema, fieldErrors } from "@/backend/security/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SERVICE_UNAVAILABLE_MESSAGE =
  "Our enquiry submission service is temporarily unavailable. Please reach us directly at quotes@caldimengg.com or try again shortly.";

function serviceUnavailableResponse(reason: string, error?: unknown) {
  console.error(`[contact] ${reason}`, error ?? "");
  return NextResponse.json(
    { ok: false, error: SERVICE_UNAVAILABLE_MESSAGE },
    {
      status: 503,
      headers: {
        "Retry-After": "60",
        "Cache-Control": "no-store",
      },
    }
  );
}

/** A form completed faster than this was not completed by a person. */
const MIN_HUMAN_FILL_MS = 2500;

/**
 * Public RFQ endpoint.
 *
 * Submissions are written to the database first and emailed second, so a mail
 * outage never loses an enquiry — the record is safely stored in /admin either way.
 */
export async function POST(request: Request) {
  try {
    const gate = await guardPublic(request, { rateLimit: RULES.contact });
    if (!gate.ok) return gate.response;

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("multipart/form-data")) {
    return jsonError("Send the form as multipart/form-data.", 415);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("That submission could not be read.", 400);
  }

  const raw = Object.fromEntries(
    Array.from(form.entries())
      .filter(([, value]) => typeof value === "string")
      .map(([key, value]) => [key, value as string])
  );

  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError("Check the fields below.", 400, { fields: fieldErrors(parsed.error) });
  }

  const data = parsed.data;

  // Two quiet bot filters. Both answer with a normal success so a scripted
  // submitter has no signal to tune against.
  if (data.website || (data.elapsedMs > 0 && data.elapsedMs < MIN_HUMAN_FILL_MS)) {
    await audit({
      action: "contact.received",
      outcome: "failure",
      actorInfo: data.email,
      meta: { reason: data.website ? "honeypot" : "too_fast" },
    });
    return jsonOk({ received: true });
  }

  if (!isDatabaseConfigured()) {
    return serviceUnavailableResponse("database is not configured (DATABASE_URL unset)");
  }

  let attachmentId: string | null = null;
  let attachmentUrl: string | null = null;
  let attachmentName: string | null = null;

  const file = form.get("file");
  if (file instanceof File && file.size > 0) {
    try {
      const stored = await storeDocumentUpload(file);
      const mediaCol = await getMediaAssetsCollection();
      const assetId = newId();
      await mediaCol.insertOne({
        _id: assetId,
        publicId: stored.publicId,
        // `raw` keeps the file opaque: Cloudinary delivers it as a
        // download rather than interpreting it as media, and the public
        // /api/media route refuses to resolve raw rows at all.
        resourceType: "raw",
        format: stored.format,
        secureUrl: stored.secureUrl,
        originalName: stored.originalName,
        mimeType: stored.mimeType,
        byteSize: stored.byteSize,
        width: null,
        height: null,
        duration: null,
        checksum: stored.checksum,
        altText: "RFQ attachment",
        title: stored.originalName,
        uploadedById: null,
        createdAt: new Date(),
      });
      attachmentId = assetId;
      attachmentUrl = stored.secureUrl;
      attachmentName = stored.originalName;
    } catch (error) {
      if (error instanceof UploadError) {
        return jsonError(error.message, 400, { fields: { file: error.message } });
      }
      return serviceUnavailableResponse("attachment storage failed", error);
    }
  }

  try {
    const contactCol = await getContactSubmissionsCollection();
    const submissionId = newId();
    await contactCol.insertOne({
      _id: submissionId,
      name: data.name,
      company: data.company,
      email: data.email,
      role: data.role,
      projectType: data.projectType,
      tonnage: data.tonnage,
      timeline: data.timeline,
      message: data.message,
      attachmentId,
      ipHash: hashIp(clientIp()),
      userAgent: clientUserAgent(),
      handled: false,
      createdAt: new Date(),
    });

    await audit({
      action: "contact.received",
      actorInfo: data.email,
      entity: "ContactSubmission",
      entityId: submissionId,
      meta: { company: data.company, hasAttachment: Boolean(attachmentId) },
    });
  } catch (error) {
    return serviceUnavailableResponse("enquiry persistence failed", error);
  }


  // Non-blocking SMTP dispatch: fire-and-forget so caller is not delayed.
  // If SMTP is not configured, this cleanly skips with zero errors or log spam.
  if (isEmailConfigured()) {
    const rfqMailData: RfqMailData = {
      name: data.name,
      company: data.company,
      email: data.email,
      role: data.role,
      projectType: data.projectType,
      tonnage: data.tonnage,
      timeline: data.timeline,
      message: data.message,
      attachmentUrl,
      attachmentName,
    };

    void Promise.allSettled([
      sendRfqNotification(rfqMailData),
      sendRfqAutoConfirmation(rfqMailData),
    ]).then((results) => {
      for (const result of results) {
        if (result.status === "rejected") {
          console.error("[contact] SMTP delivery error:", result.reason);
        }
      }
    });
  }

    return jsonOk({ received: true });
  } catch (error) {
    return serviceUnavailableResponse("unexpected POST error", error);
  }
}
