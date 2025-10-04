import React from 'react';
/**
 * Push-to-Talk (PTT) functionality
 * Handles keyboard and touch events for push-to-talk mode
 */

export interface PTTConfig {
  key: string;
  enabled: boolean;
  onStart: () => void;
  onEnd: () => void;
}

export interface PTTState {
  isActive: boolean;
  isEnabled: boolean;
  key: string;
}

class PTTManager {
  private config: PTTConfig | null = null;
  private state: PTTState = {
    isActive: false,
    isEnabled: false,
    key: 'Space'
  };
  private keyDownHandler?: (event: KeyboardEvent) => void;
  private keyUpHandler?: (event: KeyboardEvent) => void;
  private touchStartHandler?: (event: TouchEvent) => void;
  private touchEndHandler?: (event: TouchEvent) => void;
  private mouseDownHandler?: (event: MouseEvent) => void;
  private mouseUpHandler?: (event: MouseEvent) => void;

  /**
   * Configure push-to-talk
   */
  configure(config: PTTConfig): void {
    this.config = config;
    this.state.isEnabled = config.enabled;
    this.state.key = config.key;

    if (config.enabled) {
      this.setupEventListeners();
    } else {
      this.removeEventListeners();
    }
  }

  /**
   * Enable/disable PTT
   */
  setEnabled(enabled: boolean): void {
    this.state.isEnabled = enabled;
    
    if (enabled && this.config) {
      this.setupEventListeners();
    } else {
      this.removeEventListeners();
      this.stopPTT();
    }
  }

  /**
   * Get current PTT state
   */
  getState(): PTTState {
    return { ...this.state };
  }

  /**
   * Check if PTT is currently active
   */
  isActive(): boolean {
    return this.state.isActive;
  }

  /**
   * Manually start PTT (for programmatic control)
   */
  startPTT(): void {
    if (!this.state.isEnabled || this.state.isActive) return;
    
    this.state.isActive = true;
    this.config?.onStart();
  }

  /**
   * Manually stop PTT (for programmatic control)
   */
  stopPTT(): void {
    if (!this.state.isActive) return;
    
    this.state.isActive = false;
    this.config?.onEnd();
  }

  /**
   * Cleanup PTT manager
   */
  cleanup(): void {
    this.removeEventListeners();
    this.stopPTT();
    this.config = null;
  }

  private setupEventListeners(): void {
    this.removeEventListeners();

    // Keyboard events
    this.keyDownHandler = (event: KeyboardEvent) => {
      if (this.shouldHandleKey(event)) {
        event.preventDefault();
        this.startPTT();
      }
    };

    this.keyUpHandler = (event: KeyboardEvent) => {
      if (this.shouldHandleKey(event)) {
        event.preventDefault();
        this.stopPTT();
      }
    };

    // Touch events
    this.touchStartHandler = (event: TouchEvent) => {
      event.preventDefault();
      this.startPTT();
    };

    this.touchEndHandler = (event: TouchEvent) => {
      event.preventDefault();
      this.stopPTT();
    };

    // Mouse events
    this.mouseDownHandler = (event: MouseEvent) => {
      event.preventDefault();
      this.startPTT();
    };

    this.mouseUpHandler = (event: MouseEvent) => {
      event.preventDefault();
      this.stopPTT();
    };

    // Add event listeners
    document.addEventListener('keydown', this.keyDownHandler);
    document.addEventListener('keyup', this.keyUpHandler);
  }

  private removeEventListeners(): void {
    if (this.keyDownHandler) {
      document.removeEventListener('keydown', this.keyDownHandler);
      this.keyDownHandler = undefined;
    }
    if (this.keyUpHandler) {
      document.removeEventListener('keyup', this.keyUpHandler);
      this.keyUpHandler = undefined;
    }
    if (this.touchStartHandler) {
      document.removeEventListener('touchstart', this.touchStartHandler);
      this.touchStartHandler = undefined;
    }
    if (this.touchEndHandler) {
      document.removeEventListener('touchend', this.touchEndHandler);
      this.touchEndHandler = undefined;
    }
    if (this.mouseDownHandler) {
      document.removeEventListener('mousedown', this.mouseDownHandler);
      this.mouseDownHandler = undefined;
    }
    if (this.mouseUpHandler) {
      document.removeEventListener('mouseup', this.mouseUpHandler);
      this.mouseUpHandler = undefined;
    }
  }

  private shouldHandleKey(event: KeyboardEvent): boolean {
    if (!this.state.isEnabled || !this.config) return false;
    
    // Only handle the configured key
    return event.code === this.config.key || event.key === this.config.key;
  }
}

// Export singleton instance
export const pttManager = new PTTManager();

/**
 * Hook for using PTT in React components
 */
export function usePTT(
  enabled: boolean,
  onStart: () => void,
  onEnd: () => void,
  key: string = 'Space'
) {
  const configurePTT = () => {
    pttManager.configure({
      key,
      enabled,
      onStart,
      onEnd
    });
  };

  // Update configuration when dependencies change
  React.useEffect(() => {
    configurePTT();
  }, [enabled, onStart, onEnd, key]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      pttManager.cleanup();
    };
  }, []);

  return {
    isActive: pttManager.isActive(),
    startPTT: () => pttManager.startPTT(),
    stopPTT: () => pttManager.stopPTT(),
    getState: () => pttManager.getState()
  };
}

// React import will be handled by the consuming component
