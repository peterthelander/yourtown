import { StoryFrame } from './types';
import { STORY_FRAMES } from './config';

export class StoryManager {
  private currentFrame: number = 0;
  private frames: StoryFrame[] = STORY_FRAMES;

  getCurrentFrame(): StoryFrame {
    return this.frames[this.currentFrame];
  }

  nextFrame(): boolean {
    this.currentFrame++;
    return this.currentFrame < this.frames.length;
  }

  isComplete(): boolean {
    return this.currentFrame >= this.frames.length;
  }

  reset(): void {
    this.currentFrame = 0;
  }
}
