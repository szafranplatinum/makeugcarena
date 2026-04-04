/**
 * Input parameters for AI script generation
 */
export interface ScriptGenerationInput {
  product: string; // Product name or description
  tone: 'professional' | 'casual' | 'energetic' | 'humorous' | 'educational';
  language: string; // e.g. 'en', 'zh', 'es'
  duration: number; // Desired duration in seconds
  targetAudience: string; // Target audience description
  platform: 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'twitter';
}

/**
 * Result of AI script generation
 */
export interface ScriptGenerationResult {
  script: string;
  wordCount: number;
  estimatedDuration: number; // in seconds
}

/**
 * ScriptAIService generates marketing scripts using AI
 *
 * Current implementation uses a sophisticated template system for generating
 * realistic scripts based on tone, platform, and audience.
 *
 * TODO: Integrate with OpenAI GPT or Anthropic Claude API for production
 */
export class ScriptAIService {
  /**
   * Generates a marketing script for the given parameters
   * Uses template-based generation (MVP) before integrating real LLM APIs
   */
  async generate(
    input: ScriptGenerationInput
  ): Promise<ScriptGenerationResult> {
    // Validate input
    this.validateInput(input);

    // TODO: Integrate with real LLM API (OpenAI GPT-4, Claude, etc.)
    // For MVP, we use a template-based approach
    const script = this.generateScriptFromTemplate(input);
    const wordCount = this.countWords(script);
    const estimatedDuration = this.estimateDuration(wordCount, input.language);

    return {
      script,
      wordCount,
      estimatedDuration,
    };
  }

  /**
   * Validates input parameters
   */
  private validateInput(input: ScriptGenerationInput): void {
    if (!input.product || input.product.trim().length === 0) {
      throw new Error('Product name is required');
    }
    if (!input.tone) {
      throw new Error('Tone is required');
    }
    if (!input.language) {
      throw new Error('Language is required');
    }
    if (input.duration < 10 || input.duration > 300) {
      throw new Error('Duration must be between 10 and 300 seconds');
    }
    if (!input.targetAudience || input.targetAudience.trim().length === 0) {
      throw new Error('Target audience is required');
    }
    if (!input.platform) {
      throw new Error('Platform is required');
    }
  }

  /**
   * Generates script from template based on tone and platform
   * This is a sophisticated template system for MVP before LLM integration
   */
  private generateScriptFromTemplate(input: ScriptGenerationInput): string {
    const { product, tone, platform, targetAudience } = input;

    // Select script template based on tone and platform
    const templates = this.getTemplates(input.language);
    const toneKey = tone as keyof typeof templates;

    if (!templates[toneKey]) {
      throw new Error(`Unsupported tone: ${tone}`);
    }

    const template = templates[toneKey];

    // Generate opening hook based on platform
    const hook = this.generateHook(platform, product, input.language);

    // Generate value proposition
    const valueProposition = this.generateValueProposition(
      product,
      targetAudience,
      input.language
    );

    // Generate call-to-action based on platform
    const cta = this.generateCTA(platform, product, input.language);

    // Combine components
    let script = `${hook}\n\n${valueProposition}\n\n${cta}`;

    // Adjust length based on duration input
    script = this.adjustScriptLength(script, input.duration, input.language);

    return script;
  }

  /**
   * Gets script templates for different tones and languages
   */
  private getTemplates(language: string): Record<string, string> {
    const langCode = language.split('-')[0].toLowerCase();

    // English templates
    if (langCode === 'en') {
      return {
        professional:
          'Introducing {product}. Designed for professionals who demand excellence. {description} Experience the difference today.',
        casual:
          'Hey! Check out {product}. It\'s pretty awesome. {description} You\'re gonna love it!',
        energetic:
          'Get ready to transform your life with {product}! {description} This changes everything. Don\'t miss out!',
        humorous:
          'Tired of struggling with this? {product} is here to save the day. {description} Your future self will thank you.',
        educational:
          'Let\'s explore {product} and why it matters. {description} This is exactly what you need to know.',
      };
    }

    // Chinese templates
    if (langCode === 'zh') {
      return {
        professional:
          '介绍{product}。为专业人士设计。{description}今天就体验不同。',
        casual:
          '嘿！看看{product}。相当棒。{description}你会喜欢的！',
        energetic:
          '准备用{product}改变你的生活！{description}这改变了一切。不要错过！',
        humorous:
          '厌倦了挣扎？{product}来拯救你。{description}你的未来自己会感谢你。',
        educational:
          '让我们探索{product}及其重要性。{description}这正是你需要知道的。',
      };
    }

    // Spanish templates
    if (langCode === 'es') {
      return {
        professional:
          'Presentamos {product}. Diseñado para profesionales que exigen excelencia. {description} Experimente la diferencia hoy.',
        casual:
          '¡Oye! Mira {product}. Es bastante increíble. {description} ¡Te encantará!',
        energetic:
          '¡Prepárate para transformar tu vida con {product}! {description} Esto lo cambia todo. ¡No te lo pierdas!',
        humorous:
          '¿Cansado de luchar? {product} viene al rescate. {description} Tu yo futuro te lo agradecerá.',
        educational:
          'Exploremos {product} y por qué importa. {description} Esto es exactamente lo que necesitas saber.',
      };
    }

    // Default English templates for unsupported languages
    return {
      professional:
        'Introducing {product}. Designed for professionals who demand excellence. {description} Experience the difference today.',
      casual:
        'Hey! Check out {product}. It\'s pretty awesome. {description} You\'re gonna love it!',
      energetic:
        'Get ready to transform your life with {product}! {description} This changes everything. Don\'t miss out!',
      humorous:
        'Tired of struggling with this? {product} is here to save the day. {description} Your future self will thank you.',
      educational:
        'Let\'s explore {product} and why it matters. {description} This is exactly what you need to know.',
    };
  }

  /**
   * Generates an attention-grabbing hook for the specific platform
   */
  private generateHook(
    platform: string,
    product: string,
    language: string
  ): string {
    const langCode = language.split('-')[0].toLowerCase();
    const isEnglish = langCode === 'en';
    const isChinese = langCode === 'zh';

    switch (platform) {
      case 'tiktok':
        return isEnglish
          ? `Watch this! ${product} will blow your mind.`
          : isChinese
            ? `看这个！${product}会让你惊讶。`
            : `¡Mira esto! ${product} te sorprenderá.`;

      case 'instagram':
        return isEnglish
          ? `Swipe to discover ${product}.`
          : isChinese
            ? `向左滑动发现${product}。`
            : `Desliza para descubrir ${product}.`;

      case 'youtube':
        return isEnglish
          ? `In this video, I'm reviewing ${product} - you won't believe what happens next.`
          : isChinese
            ? `在这个视频中，我在评测${product} - 你不会相信接下来会发生什么。`
            : `En este video, estoy revisando ${product} - no creerás lo que sucede después.`;

      case 'linkedin':
        return isEnglish
          ? `I just discovered something incredible: ${product}. Here's why it matters for professionals.`
          : isChinese
            ? `我刚发现了一些令人难以置信的东西：${product}。以下是它对专业人士的重要性。`
            : `Acabo de descubrir algo increíble: ${product}. Aquí te digo por qué importa para los profesionales.`;

      case 'twitter':
        return isEnglish
          ? `${product} just changed the game. Here's what you need to know 🧵`
          : isChinese
            ? `${product}刚刚改变了游戏规则。以下是你需要知道的 🧵`
            : `${product} acaba de cambiar el juego. Aquí está lo que necesitas saber 🧵`;

      default:
        return isEnglish
          ? `Introducing ${product}.`
          : isChinese
            ? `介绍${product}。`
            : `Presentamos ${product}.`;
    }
  }

  /**
   * Generates a value proposition statement
   */
  private generateValueProposition(
    product: string,
    targetAudience: string,
    language: string
  ): string {
    const langCode = language.split('-')[0].toLowerCase();
    const isEnglish = langCode === 'en';
    const isChinese = langCode === 'zh';

    if (isEnglish) {
      return `${product} is built specifically for ${targetAudience}. With cutting-edge features and intuitive design, it solves your biggest pain points. You'll save time, reduce costs, and achieve better results than ever before.`;
    }

    if (isChinese) {
      return `${product}是为${targetAudience}专门构建的。具有尖端功能和直观的设计，它解决了你最大的痛点。你将节省时间，降低成本，并获得比以往更好的结果。`;
    }

    return `${product} está construido específicamente para ${targetAudience}. Con características de vanguardia y diseño intuitivo, resuelve tus mayores problemas. Ahorrarás tiempo, reducirás costos y lograrás mejores resultados que nunca.`;
  }

  /**
   * Generates a call-to-action appropriate for the platform
   */
  private generateCTA(
    platform: string,
    product: string,
    language: string
  ): string {
    const langCode = language.split('-')[0].toLowerCase();
    const isEnglish = langCode === 'en';
    const isChinese = langCode === 'zh';

    switch (platform) {
      case 'tiktok':
        return isEnglish
          ? `Get ${product} now. Link in bio!`
          : isChinese
            ? `现在获取${product}。链接在简介中！`
            : `Obtén ${product} ahora. ¡Enlace en la biografía!`;

      case 'instagram':
        return isEnglish
          ? `Ready to transform? Tap the link in our bio to get started with ${product} today.`
          : isChinese
            ? `准备改变了吗？点击我们简介中的链接，今天开始使用${product}。`
            : `¿Listo para transformarte? Toca el enlace en nuestra biografía para comenzar con ${product} hoy.`;

      case 'youtube':
        return isEnglish
          ? `If you found this helpful, click the link below to get ${product} and don't forget to subscribe!`
          : isChinese
            ? `如果这有帮助，请点击下面的链接获取${product}，别忘了订阅！`
            : `Si encontraste esto útil, haz clic en el enlace a continuación para obtener ${product} y no olvides suscribirte.`;

      case 'linkedin':
        return isEnglish
          ? `Learn more about how ${product} can elevate your professional game. Connect with us today.`
          : isChinese
            ? `了解${product}如何提升你的专业水平。今天与我们联系。`
            : `Aprende más sobre cómo ${product} puede elevar tu juego profesional. Conéctate con nosotros hoy.`;

      case 'twitter':
        return isEnglish
          ? `Ready to level up? Get ${product} today and join thousands of satisfied users.`
          : isChinese
            ? `准备升级？今天获取${product}并加入数千名满意的用户。`
            : `¿Listo para mejorar? Obtén ${product} hoy y únete a miles de usuarios satisfechos.`;

      default:
        return isEnglish
          ? `Start using ${product} today.`
          : isChinese
            ? `今天开始使用${product}。`
            : `Comienza a usar ${product} hoy.`;
    }
  }

  /**
   * Adjusts script length to match desired duration
   */
  private adjustScriptLength(
    script: string,
    targetDuration: number,
    language: string
  ): string {
    const wordCount = this.countWords(script);
    const currentDuration = this.estimateDuration(wordCount, language);

    if (currentDuration < targetDuration * 0.9) {
      // Script is too short, expand it
      return this.expandScript(script, wordCount, targetDuration, language);
    } else if (currentDuration > targetDuration * 1.1) {
      // Script is too long, trim it
      return this.trimScript(script, wordCount, targetDuration, language);
    }

    // Script is within acceptable range
    return script;
  }

  /**
   * Expands a script to reach target duration
   */
  private expandScript(
    script: string,
    currentWordCount: number,
    targetDuration: number,
    language: string
  ): string {
    const targetWordCount = this.calculateTargetWordCount(
      targetDuration,
      language
    );
    const wordsNeeded = targetWordCount - currentWordCount;

    if (wordsNeeded <= 0) return script;

    // Add expansion based on needed words
    const expansion = this.generateScriptExpansion(wordsNeeded, language);
    return script.replace(/\n\n$/g, `\n\n${expansion}\n\n`);
  }

  /**
   * Trims a script to fit target duration
   */
  private trimScript(
    script: string,
    currentWordCount: number,
    targetDuration: number,
    language: string
  ): string {
    const targetWordCount = this.calculateTargetWordCount(
      targetDuration,
      language
    );

    const words = script.split(/\s+/);
    return words.slice(0, targetWordCount).join(' ');
  }

  /**
   * Generates expansion text for longer scripts
   */
  private generateScriptExpansion(wordCount: number, language: string): string {
    const langCode = language.split('-')[0].toLowerCase();

    if (langCode === 'en') {
      return `Here are some key benefits you should know about. First, it's incredibly easy to use. Second, it integrates seamlessly with your existing tools. Third, you'll see results immediately. That's why ${Math.ceil(wordCount / 20)} professionals recommend it.`;
    }

    if (langCode === 'zh') {
      return `以下是你应该知道的一些关键好处。首先，它非常易于使用。其次，它与你现有的工具无缝集成。第三，你会立即看到结果。这就是为什么${Math.ceil(wordCount / 20)}名专业人士推荐它。`;
    }

    return `Aquí hay algunos beneficios clave que deberías saber. Primero, es increíblemente fácil de usar. Segundo, se integra sin problemas con tus herramientas existentes. Tercero, verás resultados inmediatamente. Por eso ${Math.ceil(wordCount / 20)} profesionales lo recomiendan.`;
  }

  /**
   * Counts words in a script
   */
  private countWords(script: string): number {
    return script
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }

  /**
   * Estimates script duration based on word count and language
   */
  private estimateDuration(wordCount: number, language: string): number {
    // Speaking rates by language (words or characters per minute)
    const speakingRates: Record<string, number> = {
      en: 150, // English
      es: 160, // Spanish
      fr: 150, // French
      de: 150, // German
      zh: 200, // Chinese
      ja: 180, // Japanese
      ko: 170, // Korean
    };

    const langCode = language.split('-')[0].toLowerCase();
    const wordsPerMinute = speakingRates[langCode] || 150;

    return Math.ceil((wordCount / wordsPerMinute) * 60);
  }

  /**
   * Calculates target word count for a given duration
   */
  private calculateTargetWordCount(
    targetDuration: number,
    language: string
  ): number {
    const speakingRates: Record<string, number> = {
      en: 150,
      es: 160,
      fr: 150,
      de: 150,
      zh: 200,
      ja: 180,
      ko: 170,
    };

    const langCode = language.split('-')[0].toLowerCase();
    const wordsPerMinute = speakingRates[langCode] || 150;

    return Math.round((targetDuration / 60) * wordsPerMinute);
  }
}

// Export singleton instance
export const scriptAIService = new ScriptAIService();
