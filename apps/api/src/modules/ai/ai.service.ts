import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai'; // OpenAI SDK v4.20.0

interface MessageHistory {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AiResponse {
  content: string;
  tokensUsed?: number;
  model?: string;
}

type PlaceholderReason = 'no-config' | 'rate-limit' | 'api-error';

// Context for the student for personalizing the system prompt.
export interface StudentContext {
  name?: string;
  currentCourse?: string;
  progress?: number;
  coursesInProgress?: { title: string; progress: number }[];
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openai?: OpenAI;

  // Timestamps for rate limiting, shared by all requests to this service instance.
  private requestTimestamps: number[] = [];

  /**
   * System prompt base para el asistente de estudiantes
   * El candidato puede modificar o extender este prompt
   */
  private readonly baseSystemPrompt = `Eres un asistente educativo amigable y servicial para estudiantes de una plataforma de cursos online.

Tu objetivo es:
- Ayudar a los estudiantes con dudas sobre el contenido de sus cursos
- Motivar y dar apoyo emocional cuando sea necesario
- Sugerir recursos y técnicas de estudio
- Responder de forma clara, concisa y amigable

Reglas:
- No des respuestas a exámenes directamente, guía al estudiante para que llegue a la respuesta
- Si no sabes algo, admítelo y sugiere buscar ayuda adicional
- Mantén un tono positivo y motivador
- Usa ejemplos prácticos cuando sea posible`;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.logger.log('OpenAI client initialized');
    } else {
      this.logger.warn('OPENAI_API_KEY not found in environment variables');
    }
  }

  /**
   * ✅ ESTRUCTURA BASE - Genera respuesta del asistente
   * ✅ IMPLEMENTADO (unificado con RAG: si relevantContext está presente, se enriquece el system prompt)
   *
   * Actualmente retorna una respuesta placeholder si OpenAI no está configurado.
   * El candidato debe:
   * 1. ✅ Implementar la llamada real a OpenAI
   * 2. ✅ Manejar errores de la API
   * 3. ⚠️ Implementar retry logic si es necesario (no implementado aún)
   * 4. ✅ Considerar rate limiting
   */
  async generateResponse(
    userMessage: string,
    history: MessageHistory[] = [],
    relevantContext?: string[],
    studentContext?: StudentContext
  ): Promise<AiResponse> {
    const useRAG = relevantContext && relevantContext.length > 0;
    this.logger.debug(
      `Generating response ${useRAG ? 'with RAG' : 'basic'} for: "${userMessage.substring(0, 50)}..."`
    );

    if (!this.openai) {
      this.logger.warn('OpenAI client not initialized, returning placeholder response');
      return this.generatePlaceholderResponse('no-config');
    }

    if (this.isRateLimited()) {
      this.logger.warn('OpenAI rate limit reached, returning placeholder response');
      return this.generatePlaceholderResponse('rate-limit');
    }
    this.recordRequest();

    try {
      let systemPrompt = studentContext
        ? this.buildContextualSystemPrompt(studentContext)
        : this.baseSystemPrompt;
      if (useRAG) {
        // Enrich system prompt with RAG context if available (relevantContext)
        const contextText = relevantContext!
          .map((ctx, i) => `[Contexto ${i + 1}]: ${ctx}`)
          .join('\n\n');
        systemPrompt += `\n\n--- CONTEXTO RELEVANTE DEL CURSO ---\n${contextText}\n\nUsa este contexto para dar respuestas más precisas y específicas sobre el contenido del curso.`;
        this.logger.debug(`RAG context included: ${relevantContext.length} chunks`);
      }

      // {system prompt (Enriched opt), history, user message}
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...history.map((msg) => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
        })),
        { role: 'user', content: userMessage },
      ];

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        temperature: 0.7, // Balance between creativity and consistency
        max_tokens: 500, // Enough maybe for an educational chat
      });

      const responseContent = completion.choices[0]?.message?.content || '';
      if (!responseContent) {
        throw new Error('Empty response from OpenAI');
      }

      return {
        content: responseContent,
        tokensUsed: completion.usage?.total_tokens,
        model: completion.model,
      };
    } catch (error) {
      this.logger.error(`Error calling OpenAI API: ${error.message}`, error.stack);
      return this.generatePlaceholderResponse('api-error');
    }
  }

  // Create embedding from text using OpenAI API (text-embedding-3-small)
  async createEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }
    if (!this.openai) {
      throw new Error('OpenAI client not initialized. Please configure OPENAI_API_KEY');
    }
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });
      const embedding = response.data[0]?.embedding;
      if (!embedding || embedding.length === 0) {
        throw new Error('Empty embedding returned from OpenAI');
      }
      return embedding;
    } catch (error) {
      this.logger.error(`Error creating embedding: ${error instanceof Error ? error.message : error}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  // Generate a streaming response from the OpenAI API. stream: true
  async *generateStreamResponse(
    userMessage: string,
    history: MessageHistory[] = [],
    relevantContext?: string[],
    studentContext?: StudentContext
  ): AsyncGenerator<string> {
    const useRAG = relevantContext && relevantContext.length > 0;
    this.logger.debug(
      `Generating STREAMING response ${useRAG ? 'with RAG' : 'basic'} for: "${userMessage.substring(
        0,
        50
      )}..."`
    );

    // If the client is not configured, we return the same placeholder but in "streaming mode"
    if (!this.openai) {
      this.logger.warn('OpenAI client not initialized, streaming placeholder response');
      const placeholder = this.generatePlaceholderResponse('no-config');
      const words = placeholder.content.split(' ');
      for (const word of words) {
        yield word + ' ';
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      return;
    }

    if (this.isRateLimited()) {
      this.logger.warn('OpenAI rate limit reached, streaming placeholder response');
      const placeholder = this.generatePlaceholderResponse('rate-limit');
      const words = placeholder.content.split(' ');
      for (const word of words) {
        yield word + ' ';
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      return;
    }
    this.recordRequest();

    try {
      let systemPrompt = studentContext
        ? this.buildContextualSystemPrompt(studentContext)
        : this.baseSystemPrompt;

      if (useRAG) {
        const contextText = relevantContext!
          .map((ctx, i) => `[Contexto ${i + 1}]: ${ctx}`)
          .join('\n\n');
        systemPrompt += `\n\n--- CONTEXTO RELEVANTE DEL CURSO ---\n${contextText}\n\nUsa este contexto para dar respuestas más precisas y específicas sobre el contenido del curso.`;
        this.logger.debug(`RAG context included (stream): ${relevantContext.length} chunks`);
      }

      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...history.map((msg) => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
        })),
        { role: 'user', content: userMessage },
      ];

      const stream = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        temperature: 0.7,
        max_tokens: 500,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          yield delta;
        }
      }
    } catch (error) {
      this.logger.error(
        `Error calling OpenAI streaming API: ${error instanceof Error ? error.message : String(
          error
        )}`,
        error instanceof Error ? error.stack : undefined
      );

      // In case of error in the middle of the stream, we send a small closing message to not leave the client "hanging".
      const fallback = this.generatePlaceholderResponse('api-error');
      yield `\n\n[Aviso]: ${fallback.content}`;
    }
  }

  // Build the contextual system prompt based on the student context.
  private buildContextualSystemPrompt(studentContext: StudentContext): string {
    const parts: string[] = [];
    if (studentContext.name?.trim()) {
      parts.push(`El estudiante se llama ${studentContext.name.trim()}.`);
    }
    if (studentContext.currentCourse?.trim()) {
      parts.push(`Está cursando: ${studentContext.currentCourse.trim()}.`);
    }
    if (studentContext.progress != null && studentContext.progress >= 0) {
      parts.push(`Progreso actual: ${studentContext.progress}%.`);
    }
    if (
      studentContext.coursesInProgress &&
      studentContext.coursesInProgress.length > 0
    ) {
      const list = studentContext.coursesInProgress
        .map((c) => `${c.title} (${c.progress}%)`)
        .join(', ');
      parts.push(`Cursos en los que está inscrito: ${list}.`);
    }
    if (parts.length === 0) return this.baseSystemPrompt;
    const block = `--- CONTEXTO DEL ESTUDIANTE ---\n${parts.join(' ')}\n\nUsa este contexto para dirigirte de forma más personal (nombre, referencias a sus cursos o al progreso) cuando sea natural.`;
    return `${this.baseSystemPrompt}\n\n${block}`;
  }

  // Generate a placeholder response based on the reason (rate limit, API error, no config).
  private generatePlaceholderResponse(reason: PlaceholderReason = 'no-config'): AiResponse {
    const messages: Record<PlaceholderReason, string> = {
      'rate-limit':
        'Vaya, parece que estamos ultra atareados. Prueba de nuevo en un par de minutos.',
      'api-error':
        'Algo ha fallado por aquí. Inténtalo en un momento; tu pregunta no se ha perdido.',
      'no-config':
        'Gracias por tu mensaje. Por ahora el asistente no está disponible; revisa el material del curso y vuelve a intentarlo más tarde.',
    };

    const content = messages[reason];

    return {
      content,
      tokensUsed: 0,
      model: 'placeholder',
    };
  }

  /**
   * Verifica si OpenAI está configurado
   */
  isConfigured(): boolean {
    return !!this.configService.get<string>('OPENAI_API_KEY');
  }

  // Get the rate limit Config
  private getRateLimitConfig(): { max: number; windowMs: number } {
    const maxRaw = this.configService.get<string | number>('OPENAI_RATE_LIMIT_MAX');
    const windowRaw = this.configService.get<string | number>('OPENAI_RATE_LIMIT_WINDOW_MS');
    const max = maxRaw != null ? Number(maxRaw) : 30;
    const windowMs = windowRaw != null ? Number(windowRaw) : 60_000;
    return { max: Math.max(1, max), windowMs: Math.max(1000, windowMs) };
  }

  // Check if the rate limit has been reached.
  private isRateLimited(): boolean {
    const { max, windowMs } = this.getRateLimitConfig();
    const now = Date.now();
    this.requestTimestamps = this.requestTimestamps.filter((t) => now - t < windowMs);
    return this.requestTimestamps.length >= max;
  }

  // Record the request timestamp for rate limiting.
  private recordRequest(): void {
    this.requestTimestamps.push(Date.now());
  }
}
