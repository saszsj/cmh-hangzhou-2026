import { z } from "zod";

export const createSubmissionSchema = z.object({
  name: z.string().trim().min(1).max(32),
  industry: z.string().trim().min(1).max(48),
  pain: z.string().trim().min(1).max(600),
});

