// Personalization Service
import { LearningProfile } from '@/lib/quiz/diagnostic-quiz';

export interface PersonalizedContent {
  difficulty: 'easy' | 'medium' | 'hard';
  examples: string[];
  explanationStyle: 'visual' | 'verbal' | 'hands-on' | 'reading';
  pacing: 'slow' | 'normal' | 'fast';
}

export class PersonalizationService {
  private static instance: PersonalizationService;
  private learningProfile: LearningProfile | null = null;
  
  private constructor() {
    // Load learning profile from localStorage on initialization
    this.loadLearningProfile();
  }
  
  // Singleton pattern
  public static getInstance(): PersonalizationService {
    if (!PersonalizationService.instance) {
      PersonalizationService.instance = new PersonalizationService();
    }
    return PersonalizationService.instance;
  }
  
  // Load learning profile from localStorage
  private loadLearningProfile() {
    try {
      const profileStr = localStorage.getItem('lana_learning_profile');
      if (profileStr) {
        this.learningProfile = JSON.parse(profileStr);
      }
    } catch (e) {
      console.warn('Could not load learning profile from localStorage');
    }
  }
  
  // Set learning profile (called after quiz completion)
  setLearningProfile(profile: LearningProfile) {
    this.learningProfile = profile;
    try {
      localStorage.setItem('lana_learning_profile', JSON.stringify(profile));
    } catch (e) {
      console.warn('Could not save learning profile to localStorage');
    }
  }
  
  // Get current learning profile
  getLearningProfile(): LearningProfile | null {
    return this.learningProfile;
  }
  
  // Get personalized content settings based on learning profile
  getPersonalizedContent(): PersonalizedContent {
    if (!this.learningProfile) {
      // Return default settings if no profile exists
      return {
        difficulty: 'medium',
        examples: [],
        explanationStyle: 'verbal',
        pacing: 'normal'
      };
    }
    
    // Map knowledge level to difficulty
    const difficultyMap: Record<string, 'easy' | 'medium' | 'hard'> = {
      'beginner': 'easy',
      'intermediate': 'medium',
      'advanced': 'hard'
    };
    
    // Map learning style to explanation style
    const explanationStyleMap: Record<string, 'visual' | 'verbal' | 'hands-on' | 'reading'> = {
      'visual': 'visual',
      'auditory': 'verbal',
      'kinesthetic': 'hands-on',
      'reading-writing': 'reading'
    };
    
    // Map knowledge level to pacing
    const pacingMap: Record<string, 'slow' | 'normal' | 'fast'> = {
      'beginner': 'slow',
      'intermediate': 'normal',
      'advanced': 'fast'
    };
    
    return {
      difficulty: difficultyMap[this.learningProfile.knowledgeLevel] || 'medium',
      examples: this.getExamplesForStyle(this.learningProfile.learningStyle),
      explanationStyle: explanationStyleMap[this.learningProfile.learningStyle] || 'verbal',
      pacing: pacingMap[this.learningProfile.knowledgeLevel] || 'normal'
    };
  }
  
  // Get examples based on learning style
  private getExamplesForStyle(learningStyle: string): string[] {
    const examples: Record<string, string[]> = {
      'visual': [
        'Here is a diagram that shows...',
        'As you can see in this chart...',
        'Let me illustrate this with an image...'
      ],
      'auditory': [
        'Let me explain this concept...',
        'Think of it this way...',
        'Here\'s how I would describe it...'
      ],
      'kinesthetic': [
        'Try this hands-on activity...',
        'Let\'s work through this together...',
        'Here\'s an experiment you can try...'
      ],
      'reading-writing': [
        'According to the research...',
        'Let me break this down in steps...',
        'Here are the key points to remember...'
      ]
    };
    
    return examples[learningStyle] || examples['auditory'];
  }
  
  // Personalize lesson content based on profile
  personalizeLessonContent(content: string): string {
    if (!this.learningProfile) {
      return content;
    }
    
    // Adjust content based on learning style
    switch (this.learningProfile.learningStyle) {
      case 'visual':
        // Add visual cues
        return content.replace(new RegExp('\\n\\n', 'g'), '\\n\\n🎯 ');
      case 'auditory':
        // Add verbal explanations
        return `Let me explain this to you:\n\n${content}`;
      case 'kinesthetic':
        // Add interactive elements
        return content.replace(new RegExp('\\n\\n', 'g'), '\\n\\n👉 ');
      case 'reading-writing':
        // Add structured format
        return `## Key Points\n\n${content}`;
      default:
        return content;
    }
  }
  
  // Get personalized prompt for AI interactions
  getPersonalizedPrompt(basePrompt: string): string {
    if (!this.learningProfile) {
      return basePrompt;
    }
    
    const personalizedElements = [];
    
    // Add knowledge level context
    personalizedElements.push(`The learner has a ${this.learningProfile.knowledgeLevel} level of understanding.`);
    
    // Add learning style context
    switch (this.learningProfile.learningStyle) {
      case 'visual':
        personalizedElements.push('Please use diagrams, charts and visual explanations.');
        break;
      case 'auditory':
        personalizedElements.push('Please use conversational explanations and analogies.');
        break;
      case 'kinesthetic':
        personalizedElements.push('Please use hands-on examples and interactive approaches.');
        break;
      case 'reading-writing':
        personalizedElements.push('Please use structured explanations and written formats.');
        break;
    }
    
    // Add difficulty preference
    personalizedElements.push(`Please adjust the difficulty to ${this.learningProfile.preferredDifficulty} level.`);
    
    return basePrompt + '\n\nContext for personalization:\n' + personalizedElements.join('\n');
  }
  
  // Get content recommendations based on profile
  getContentRecommendations(topics: string[]): string[] {
    if (!this.learningProfile) {
      return topics.slice(0, 3); // Return first 3 topics if no profile
    }
    
    // For beginners, recommend foundational topics
    if (this.learningProfile.knowledgeLevel === 'beginner') {
      return topics.filter(topic => 
        topic.toLowerCase().includes('basics') || 
        topic.toLowerCase().includes('introduction') ||
        topic.toLowerCase().includes('fundamentals')
      ).slice(0, 3);
    }
    
    // For advanced learners, recommend challenging topics
    if (this.learningProfile.knowledgeLevel === 'advanced') {
      return topics.filter(topic => 
        topic.toLowerCase().includes('advanced') || 
        topic.toLowerCase().includes('complex') ||
        topic.toLowerCase().includes('deep dive')
      ).slice(0, 3);
    }
    
    // For intermediate learners, recommend a mix
    return topics.slice(0, 3);
  }
}

// Create and export singleton instance
export const personalizationService = PersonalizationService.getInstance();