import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-scientific-calculator',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-card class="glass-card calculator-card">
      <ion-card-header>
        <ion-card-title>Quick Calculator</ion-card-title>
        <ion-card-subtitle>Starter GATE-style aid for practice sessions</ion-card-subtitle>
      </ion-card-header>
      <ion-card-content class="stack">
        <div class="display">
          <span class="expression">{{ expression() || '0' }}</span>
          <strong>{{ result() }}</strong>
        </div>

        <div class="button-grid">
          <ion-button fill="outline" size="small" (click)="clear()">AC</ion-button>
          <ion-button fill="outline" size="small" (click)="backspace()">DEL</ion-button>
          <ion-button fill="outline" size="small" (click)="append('(')">(</ion-button>
          <ion-button fill="outline" size="small" (click)="append(')')">)</ion-button>

          <ion-button fill="outline" size="small" (click)="append('sin(')">sin</ion-button>
          <ion-button fill="outline" size="small" (click)="append('cos(')">cos</ion-button>
          <ion-button fill="outline" size="small" (click)="append('tan(')">tan</ion-button>
          <ion-button fill="outline" size="small" (click)="append('/')">/</ion-button>

          <ion-button fill="outline" size="small" (click)="append('7')">7</ion-button>
          <ion-button fill="outline" size="small" (click)="append('8')">8</ion-button>
          <ion-button fill="outline" size="small" (click)="append('9')">9</ion-button>
          <ion-button fill="outline" size="small" (click)="append('*')">x</ion-button>

          <ion-button fill="outline" size="small" (click)="append('4')">4</ion-button>
          <ion-button fill="outline" size="small" (click)="append('5')">5</ion-button>
          <ion-button fill="outline" size="small" (click)="append('6')">6</ion-button>
          <ion-button fill="outline" size="small" (click)="append('-')">-</ion-button>

          <ion-button fill="outline" size="small" (click)="append('1')">1</ion-button>
          <ion-button fill="outline" size="small" (click)="append('2')">2</ion-button>
          <ion-button fill="outline" size="small" (click)="append('3')">3</ion-button>
          <ion-button fill="outline" size="small" (click)="append('+')">+</ion-button>

          <ion-button fill="outline" size="small" (click)="append('0')">0</ion-button>
          <ion-button fill="outline" size="small" (click)="append('.')">.</ion-button>
          <ion-button fill="outline" size="small" (click)="append('pi')">pi</ion-button>
          <ion-button fill="outline" size="small" (click)="append('sqrt(')">sqrt</ion-button>

          <ion-button fill="solid" color="primary" class="equals" (click)="evaluate()">=</ion-button>
        </div>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    .calculator-card {
      margin: 0;
    }

    .display {
      padding: 16px;
      border-radius: 18px;
      background: rgba(245, 247, 255, 0.92);
      border: 1px solid var(--gk-outline);
      min-height: 104px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 12px;
    }

    .expression {
      color: var(--gk-muted);
      word-break: break-all;
    }

    .display strong {
      font-size: 1.35rem;
      color: var(--ion-color-dark);
    }

    .button-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
    }

    .equals {
      grid-column: span 4;
    }
  `],
})
export class ScientificCalculatorComponent {
  readonly expression = signal('');
  readonly result = signal('0');

  append(value: string): void {
    this.expression.update((current) => `${current}${value}`);
  }

  clear(): void {
    this.expression.set('');
    this.result.set('0');
  }

  backspace(): void {
    this.expression.update((current) => current.slice(0, -1));
  }

  evaluate(): void {
    const expression = this.expression().trim();
    if (!expression) {
      this.result.set('0');
      return;
    }

    const letterTokens = expression.match(/[A-Za-z]+/g) ?? [];
    const allowedTokens = new Set(['sin', 'cos', 'tan', 'sqrt', 'pi']);
    if (letterTokens.some((token) => !allowedTokens.has(token))) {
      this.result.set('Invalid');
      return;
    }

    if (/[^0-9+\-*/().A-Za-z]/.test(expression)) {
      this.result.set('Invalid');
      return;
    }

    const normalized = expression
      .replace(/\bpi\b/g, 'Math.PI')
      .replace(/\bsin\(/g, 'Math.sin(')
      .replace(/\bcos\(/g, 'Math.cos(')
      .replace(/\btan\(/g, 'Math.tan(')
      .replace(/\bsqrt\(/g, 'Math.sqrt(');

    try {
      const output = Function(`"use strict"; return (${normalized});`)() as number;
      this.result.set(Number.isFinite(output) ? String(Number(output.toFixed(6))) : 'Invalid');
    } catch {
      this.result.set('Invalid');
    }
  }
}
