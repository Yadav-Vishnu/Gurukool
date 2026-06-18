import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { CommunityService } from '../../core/services/community.service';
import {
  AudioCallRoom,
  CallSignal,
  CollaborationEvent,
  CollaborationNotification,
  DiscussionQuestion,
  PeerConnection,
  PeerSearchResult,
  QuestionDiscussion,
} from '../../core/models/community.models';
import { AppHeaderComponent } from '../../shared/app-header.component';
import { AppFooterComponent } from '../../shared/app-footer.component';

@Component({
  selector: 'app-community-page',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, AppHeaderComponent, AppFooterComponent],
  template: `
    <app-header></app-header>
    <ion-content [fullscreen]="true">
      <div class="page-shell stack community-shell">
        
        <!-- Hero Header -->
        <section class="glass-card hero-card stack">
          <span class="section-kicker">Phase 5 - Community & Collaboration</span>
          <h1>GATE & ESE Aspirant Sanctuary Forums</h1>
          <p class="muted-copy">
            Discuss complex engineering questions, connect with peer study groups, and schedule secure, low-latency WebRTC study rooms to crack ESE/GATE together.
          </p>
        </section>

        <!-- System Alerts -->
        <div class="alert-bar success-alert" *ngIf="successMessage()">
          <svg class="alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ successMessage() }}</span>
        </div>
        <div class="alert-bar error-alert" *ngIf="errorMessage()">
          <svg class="alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{{ errorMessage() }}</span>
        </div>

        <!-- Main Dashboard Split Layout -->
        <div class="community-dashboard-grid">
          
          <!-- LEFT SIDE: Question Forum & Discussions -->
          <div class="grid-column-left stack">
            
            <!-- Question Forum Card -->
            <section class="glass-card panel-card stack">
              <div class="panel-header">
                <div>
                  <span class="panel-subtitle">GATE / ESE Subject Doubts</span>
                  <h2>Interactive Question Forum</h2>
                </div>
                <ion-button size="small" fill="outline" color="primary" (click)="loadQuestions()">
                  <ion-icon name="sync-outline" slot="start"></ion-icon>
                  Refresh
                </ion-button>
              </div>

              <!-- Search Bar -->
              <div class="custom-input-group">
                <label class="input-label">Filter Questions by Topic or Keyword</label>
                <div class="search-input-wrapper">
                  <ion-input
                    [ngModel]="questionSearch()"
                    (ngModelChange)="questionSearch.set(toText($event))"
                    placeholder="e.g. matrices, thermodynamics, ONGC 2023, aptitude">
                  </ion-input>
                  <ion-button size="small" fill="clear" (click)="loadQuestions()" class="search-inside-btn">
                    Search
                  </ion-button>
                </div>
              </div>

              <!-- Question Feed List -->
              <div class="question-list-container">
                <div class="question-list" *ngIf="questions().length; else noQuestionsFound">
                  <button
                    type="button"
                    class="question-row-btn"
                    *ngFor="let question of questions()"
                    [class.active-question]="selectedQuestionId() === question.id"
                    (click)="selectQuestion(question.id)">
                    <div class="question-meta">
                      <span class="badge-subject">{{ question.subject.code }}</span>
                      <span class="badge-exam">{{ question.sourceTag.examCode }}</span>
                      <span class="badge-source" *ngIf="question.sourceTag.companyName">{{ question.sourceTag.companyName }}</span>
                      <span class="badge-year" *ngIf="question.sourceTag.examYear">{{ question.sourceTag.examYear }}</span>
                    </div>
                    <p class="question-prompt-excerpt">{{ question.prompt }}</p>
                    <div class="question-row-footer">
                      <span>💬 {{ question.discussionCount }} responses</span>
                    </div>
                  </button>
                </div>
                <ng-template #noQuestionsFound>
                  <div class="empty-state-small">
                    <p>No forum discussions match your query.</p>
                  </div>
                </ng-template>
              </div>

              <!-- Active Discussion Feed Panel -->
              <div class="active-discussion-panel stack" *ngIf="selectedDiscussion() as discussion">
                <div class="discussion-divider"></div>
                <div class="discussion-header">
                  <h4>Discussion: {{ discussion.question.subject.name }}</h4>
                  <span class="thread-status">Active Thread</span>
                </div>

                <div class="posts-timeline" *ngIf="discussion.posts.length; else noDiscussionPosts">
                  <div class="post-bubble" *ngFor="let post of discussion.posts">
                    <div class="post-meta">
                      <strong class="author-name">{{ post.author.fullName }}</strong>
                      <span class="post-time">{{ formatDate(post.createdAt) }}</span>
                    </div>
                    <p class="post-content-text">{{ post.content }}</p>
                  </div>
                </div>

                <!-- Post Reply Panel -->
                <div class="reply-editor-wrapper">
                  <label class="input-label">Contribute to discussion</label>
                  <ion-textarea
                    auto-grow="true"
                    rows="3"
                    [ngModel]="discussionReply()"
                    (ngModelChange)="discussionReply.set(toText($event))"
                    placeholder="Offer your calculation steps, clarify formulas, or ask a follow-up query...">
                  </ion-textarea>
                  <ion-button expand="block" color="primary" class="btn-post-reply" (click)="postDiscussionReply()">
                    Post Answer Reply
                  </ion-button>
                </div>
              </div>
            </section>

            <!-- Study Calendar & Room Scheduler -->
            <section class="glass-card panel-card stack">
              <div class="panel-header">
                <div>
                  <span class="panel-subtitle">Plan Study Rooms</span>
                  <h2>Study Calendar & Co-Revision</h2>
                </div>
              </div>

              <div class="calendar-form-card stack">
                <h3>Propose a Shared Session</h3>
                
                <div class="input-grid-2">
                  <div class="custom-input-group">
                    <label class="input-label">Select Connected Peer</label>
                    <ion-item lines="none" class="custom-field">
                      <ion-select
                        interface="popover"
                        [ngModel]="eventPeerId()"
                        (ngModelChange)="setEventPeerId($event)">
                        <ion-select-option *ngFor="let connection of acceptedConnections()" [value]="connection.peer.id">
                          {{ connection.peer.fullName }}
                        </ion-select-option>
                      </ion-select>
                    </ion-item>
                  </div>
                  <div class="custom-input-group">
                    <label class="input-label">Session Topic Title</label>
                    <ion-item lines="none" class="custom-field">
                      <ion-input [ngModel]="eventTitle()" (ngModelChange)="eventTitle.set(toText($event))"></ion-input>
                    </ion-item>
                  </div>
                </div>

                <div class="custom-input-group">
                  <label class="input-label">Session Agenda / Revision Focus</label>
                  <ion-item lines="none" class="custom-field">
                    <ion-textarea
                      auto-grow="true"
                      rows="2"
                      [ngModel]="eventAgenda()"
                      (ngModelChange)="eventAgenda.set(toText($event))"
                      placeholder="e.g. Solving 15 ESE Calculus questions and discussing weak concepts...">
                    </ion-textarea>
                  </ion-item>
                </div>

                <div class="input-grid-2">
                  <div class="custom-input-group">
                    <label class="input-label">Starts At</label>
                    <ion-item lines="none" class="custom-field">
                      <ion-input
                        type="datetime-local"
                        [ngModel]="eventStartsAt()"
                        (ngModelChange)="eventStartsAt.set(toText($event))">
                      </ion-input>
                    </ion-item>
                  </div>
                  <div class="custom-input-group">
                    <label class="input-label">Ends At</label>
                    <ion-item lines="none" class="custom-field">
                      <ion-input
                        type="datetime-local"
                        [ngModel]="eventEndsAt()"
                        (ngModelChange)="eventEndsAt.set(toText($event))">
                      </ion-input>
                    </ion-item>
                  </div>
                </div>

                <ion-button expand="block" color="secondary" (click)="proposeEvent()">
                  Schedule Session Invitation
                </ion-button>
              </div>

              <!-- Scheduled Events Timeline -->
              <div class="events-list-container stack">
                <h3>Scheduled Study Sessions</h3>
                <div class="event-list" *ngIf="calendarEvents().length; else noEventsScheduled">
                  <div class="event-card-item stack" *ngFor="let event of calendarEvents()">
                    <div class="event-card-header">
                      <strong>{{ event.title }}</strong>
                      <span class="status-badge" [class.confirmed]="event.status === 'confirmed'">
                        {{ event.status }}
                      </span>
                    </div>
                    <span class="event-peer">With: {{ event.peer.fullName }}</span>
                    <p class="event-time-span">
                      📅 {{ formatDate(event.startsAt) }} — {{ formatTime(event.endsAt) }}
                    </p>
                    <p class="event-agenda-text" *ngIf="event.agenda">{{ event.agenda }}</p>

                    <div class="event-actions-grid">
                      <ion-button size="small" color="success" (click)="confirmEvent(event)" [disabled]="event.status === 'confirmed'">
                        Confirm Room
                      </ion-button>
                      <ion-button size="small" fill="outline" color="secondary" (click)="showReschedule(event)">
                        Reschedule
                      </ion-button>
                    </div>

                    <!-- Calendar Provider Integration Sync -->
                    <div class="sync-actions-row">
                      <span>Sync to Calendar:</span>
                      <button type="button" class="btn-sync-link google" (click)="syncCalendar(event, 'google')">Google Sync</button>
                      <button type="button" class="btn-sync-link outlook" (click)="syncCalendar(event, 'outlook')">Outlook Sync</button>
                    </div>

                    <!-- Inline Reschedule Box -->
                    <div class="reschedule-form-box stack" *ngIf="rescheduleEventId() === event.id">
                      <h4>Suggest Reschedule Timing</h4>
                      <div class="input-grid-2">
                        <div class="custom-input-group">
                          <label class="input-label">Proposed Start</label>
                          <ion-item lines="none" class="custom-field">
                            <ion-input
                              type="datetime-local"
                              [ngModel]="rescheduleStartsAt()"
                              (ngModelChange)="rescheduleStartsAt.set(toText($event))">
                            </ion-input>
                          </ion-item>
                        </div>
                        <div class="custom-input-group">
                          <label class="input-label">Proposed End</label>
                          <ion-item lines="none" class="custom-field">
                            <ion-input
                              type="datetime-local"
                              [ngModel]="rescheduleEndsAt()"
                              (ngModelChange)="rescheduleEndsAt.set(toText($event))">
                            </ion-input>
                          </ion-item>
                        </div>
                      </div>
                      <div class="custom-input-group">
                        <label class="input-label">Reason for reschedule</label>
                        <ion-item lines="none" class="custom-field">
                          <ion-input
                            placeholder="e.g. coaching class conflict"
                            [ngModel]="rescheduleReason()"
                            (ngModelChange)="rescheduleReason.set(toText($event))">
                          </ion-input>
                        </ion-item>
                      </div>
                      <ion-button expand="block" color="secondary" size="small" (click)="requestReschedule(event)">
                        Send Reschedule Request
                      </ion-button>
                    </div>

                    <!-- Reschedule Pending Action Bar -->
                    <div class="reschedule-pending-alert stack" *ngIf="event.pendingReschedule as pending">
                      <strong>Reschedule Proposed by {{ pending.requestedByUserId === userId() ? 'You' : 'Peer' }}</strong>
                      <p>Proposed: {{ formatDate(pending.proposedStartsAt) }} to {{ formatTime(pending.proposedEndsAt) }}</p>
                      <div class="action-buttons-inline" *ngIf="pending.requestedByUserId !== userId()">
                        <ion-button size="small" color="success" (click)="respondReschedule(pending.id, 'accept')">Accept</ion-button>
                        <ion-button size="small" fill="outline" color="danger" (click)="respondReschedule(pending.id, 'decline')">Decline</ion-button>
                      </div>
                    </div>

                  </div>
                </div>
                <ng-template #noEventsScheduled>
                  <p class="empty-text-copy">No upcoming study sessions proposed yet.</p>
                </ng-template>
              </div>
            </section>

          </div>

          <!-- RIGHT SIDE: Peer Connect, Audio Rooms & Notifications -->
          <div class="grid-column-right stack">

            <!-- Secure Audio Rooms WebRTC -->
            <section class="glass-card panel-card premium-call-card stack">
              <div class="panel-header">
                <div>
                  <span class="panel-subtitle">Low-Latency Signaling</span>
                  <h2>WebRTC Study Rooms</h2>
                </div>
                <span class="call-badge" [class.active-call-badge]="activeCall()">{{ callStatus() }}</span>
              </div>

              <!-- Subscription restriction notification -->
              <div class="upsell-cue-mini">
                <svg class="icon-key" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div class="cue-content">
                  <strong>Free Audio Limit: 10 mins / day</strong>
                  <p>Upgrade to Gurukool Pro for unlimited high-fidelity group sessions.</p>
                </div>
              </div>

              <div class="call-dialer-widget stack">
                <div class="custom-input-group">
                  <label class="input-label">Select Peer to Call</label>
                  <ion-item lines="none" class="custom-field">
                    <ion-select
                      interface="popover"
                      [ngModel]="callPeerId()"
                      (ngModelChange)="setCallPeerId($event)"
                      placeholder="Select connected peer">
                      <ion-select-option *ngFor="let connection of acceptedConnections()" [value]="connection.peer.id">
                        {{ connection.peer.fullName }}
                      </ion-select-option>
                    </ion-select>
                  </ion-item>
                </div>

                <div class="dialer-actions">
                  <ion-button expand="block" color="secondary" (click)="startAudioCall()" [disabled]="activeCall()">
                    <ion-icon name="call-outline" slot="start"></ion-icon>
                    Start Room
                  </ion-button>
                  <ion-button expand="block" fill="outline" color="danger" (click)="endAudioCall()" [disabled]="!activeCall()">
                    <ion-icon name="close-circle-outline" slot="start"></ion-icon>
                    End Session
                  </ion-button>
                </div>

                <audio #remoteAudio autoplay class="hidden-audio-tag"></audio>
              </div>

              <!-- Active/Joinable Calls -->
              <div class="active-calls-container stack">
                <h3>Live Audio Rooms</h3>
                <div class="call-list" *ngIf="audioCalls().length; else noCallsAvailable">
                  <div class="call-row-item" *ngFor="let call of audioCalls()">
                    <div class="call-row-info">
                      <strong>{{ call.peer.fullName }}</strong>
                      <span>Status: {{ call.status }}</span>
                    </div>
                    <ion-button
                      size="small"
                      fill="solid"
                      color="secondary"
                      [disabled]="call.status === 'ended'"
                      (click)="joinAudioCall(call)">
                      Join Room
                    </ion-button>
                  </div>
                </div>
                <ng-template #noCallsAvailable>
                  <p class="empty-text-copy">No active audio channels detected.</p>
                </ng-template>
              </div>
            </section>
            
            <!-- Peer Connect Card -->
            <section class="glass-card panel-card stack">
              <div class="panel-header">
                <div>
                  <span class="panel-subtitle">Find serious aspirants</span>
                  <h2>Peer Connect Network</h2>
                </div>
                <ion-button size="small" fill="outline" color="primary" (click)="loadPeers()">
                  <ion-icon name="search-outline" slot="start"></ion-icon>
                  Search
                </ion-button>
              </div>

              <!-- Peer Search Input -->
              <div class="custom-input-group">
                <label class="input-label">Search Students by Name or Email</label>
                <div class="search-input-wrapper">
                  <ion-input
                    [ngModel]="peerSearch()"
                    (ngModelChange)="peerSearch.set(toText($event))"
                    placeholder="Enter name, email, or college/batch...">
                  </ion-input>
                </div>
              </div>

              <!-- Peer Results list -->
              <div class="peer-grid-list stack">
                <h3>Find New Peers</h3>
                <div class="peer-grid-list stack">
                  <div class="peer-results-grid" *ngIf="peerResults().length; else noPeersFound">
                    <div class="peer-profile-tile" *ngFor="let peer of peerResults()">
                      <div class="tile-avatar">
                        {{ peer.fullName.charAt(0) }}
                      </div>
                      <div class="tile-info">
                        <strong>{{ peer.fullName }}</strong>
                        <span class="peer-status">{{ peer.connectionStatus || 'not connected' }}</span>
                      </div>
                      <ion-button
                        size="small"
                        color="primary"
                        [disabled]="!!peer.connectionStatus"
                        (click)="sendPeerRequest(peer)">
                        Connect
                      </ion-button>
                    </div>
                  </div>
                  <ng-template #noPeersFound>
                    <p class="empty-text-copy">No students found matching search string.</p>
                  </ng-template>
                </div>
              </div>

              <!-- Active Peer Connections list -->
              <div class="connections-list-wrapper stack">
                <h3>My Connections</h3>
                <div class="connections-grid" *ngIf="connections().length; else noConnections">
                  <div class="peer-profile-tile" *ngFor="let connection of connections()">
                    <div class="tile-avatar border-glow">
                      {{ connection.peer.fullName.charAt(0) }}
                    </div>
                    <div class="tile-info">
                      <strong>{{ connection.peer.fullName }}</strong>
                      <span class="peer-status-tag" [class.accepted]="connection.status === 'accepted'">
                        {{ connection.status }} ({{ connection.direction }})
                      </span>
                    </div>
                    
                    <div class="action-buttons-inline" *ngIf="connection.status === 'pending' && connection.direction === 'incoming'">
                      <ion-button size="small" color="success" (click)="respondPeer(connection, 'accept')">Accept</ion-button>
                      <ion-button size="small" fill="outline" color="danger" (click)="respondPeer(connection, 'decline')">Decline</ion-button>
                    </div>
                  </div>
                </div>
                <ng-template #noConnections>
                  <p class="empty-text-copy">You haven't added any study peers yet.</p>
                </ng-template>
              </div>
            </section>

            <!-- Notifications Card -->
            <section class="glass-card panel-card stack">
              <div class="panel-header">
                <div>
                  <span class="panel-subtitle">Activity Updates</span>
                  <h2>Collaboration Notifications</h2>
                </div>
              </div>

              <div class="notification-list-wrapper">
                <div class="notification-grid" *ngIf="notifications().length; else noNotifications">
                  <div class="notification-item-card" *ngFor="let notification of notifications()" [class.unread-notif]="!notification.isRead">
                    <div class="notif-body">
                      <strong>{{ notification.title }}</strong>
                      <p>{{ notification.body }}</p>
                    </div>
                    <ion-button
                      size="small"
                      fill="clear"
                      color="secondary"
                      [disabled]="notification.isRead"
                      (click)="markNotificationRead(notification)">
                      Mark Read
                    </ion-button>
                  </div>
                </div>
                <ng-template #noNotifications>
                  <p class="empty-text-copy">Your collaboration inbox is clear.</p>
                </ng-template>
              </div>
            </section>

          </div>

        </div>

      </div>
      <app-footer></app-footer>
    </ion-content>

    <ng-template #noDiscussionPosts>
      <div class="empty-state-timeline">
        <p>No replies yet. Be the first to start the discussion for this question!</p>
      </div>
    </ng-template>
  `,
  styleUrls: ['./community.page.scss'],
})
export class CommunityPage implements OnInit, OnDestroy {
  @ViewChild('remoteAudio') private readonly remoteAudio?: ElementRef<HTMLAudioElement>;

  private readonly communityService = inject(CommunityService);
  private readonly authService = inject(AuthService);

  readonly userId = computed(() => this.authService.user()?.id ?? null);
  readonly loading = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly questionSearch = signal('');
  readonly questions = signal<DiscussionQuestion[]>([]);
  readonly selectedQuestionId = signal<string | null>(null);
  readonly selectedDiscussion = signal<QuestionDiscussion | null>(null);
  readonly discussionReply = signal('');

  readonly peerSearch = signal('');
  readonly peerResults = signal<PeerSearchResult[]>([]);
  readonly connections = signal<PeerConnection[]>([]);
  readonly acceptedConnections = computed(() =>
    this.connections().filter((connection) => connection.status === 'accepted')
  );

  readonly callPeerId = signal<string | null>(null);
  readonly audioCalls = signal<AudioCallRoom[]>([]);
  readonly activeCall = signal<AudioCallRoom | null>(null);
  readonly callStatus = signal('Idle');

  readonly eventPeerId = signal<string | null>(null);
  readonly eventTitle = signal('Focused study session');
  readonly eventAgenda = signal('');
  readonly eventStartsAt = signal(this.toDateTimeLocal(new Date(Date.now() + 60 * 60 * 1000)));
  readonly eventEndsAt = signal(this.toDateTimeLocal(new Date(Date.now() + 2 * 60 * 60 * 1000)));
  readonly calendarEvents = signal<CollaborationEvent[]>([]);

  readonly rescheduleEventId = signal<string | null>(null);
  readonly rescheduleStartsAt = signal(this.toDateTimeLocal(new Date(Date.now() + 24 * 60 * 60 * 1000)));
  readonly rescheduleEndsAt = signal(this.toDateTimeLocal(new Date(Date.now() + 25 * 60 * 60 * 1000)));
  readonly rescheduleReason = signal('');

  readonly notifications = signal<CollaborationNotification[]>([]);

  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private pollTimer: any = null;
  private lastSignalAt: string | null = null;

  async ngOnInit(): Promise<void> {
    await this.refreshAll();
  }

  ngOnDestroy(): void {
    this.cleanupAudio(false);
  }

  toText(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }

  setCallPeerId(value: unknown): void {
    this.callPeerId.set(typeof value === 'string' && value ? value : null);
  }

  setEventPeerId(value: unknown): void {
    this.eventPeerId.set(typeof value === 'string' && value ? value : null);
  }

  async refreshAll(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const [questions, peers, connections, events, calls, notifications] = await Promise.all([
        this.communityService.listDiscussionQuestions(this.questionSearch().trim() || undefined),
        this.communityService.searchPeers(this.peerSearch().trim() || undefined),
        this.communityService.listPeerConnections(),
        this.communityService.listCalendarEvents(),
        this.communityService.listAudioCalls(),
        this.communityService.listNotifications(),
      ]);

      this.questions.set(questions);
      this.peerResults.set(peers);
      this.connections.set(connections);
      this.calendarEvents.set(events);
      this.audioCalls.set(calls);
      this.notifications.set(notifications);
      this.setDefaultPeerSelections();

      const selectedQuestionId = this.selectedQuestionId() ?? questions[0]?.id ?? null;
      if (selectedQuestionId) {
        await this.selectQuestion(selectedQuestionId);
      }
    } catch (error) {
      this.errorMessage.set(this.authService.readError(error, 'Community data could not be loaded.'));
    } finally {
      this.loading.set(false);
    }
  }

  async loadQuestions(): Promise<void> {
    try {
      const questions = await this.communityService.listDiscussionQuestions(
        this.questionSearch().trim() || undefined
      );
      this.questions.set(questions);
      if (questions[0]) {
        await this.selectQuestion(questions[0].id);
      }
    } catch (error) {
      this.errorMessage.set(this.authService.readError(error, 'Question search failed.'));
    }
  }

  async selectQuestion(questionId: string): Promise<void> {
    this.selectedQuestionId.set(questionId);

    try {
      const discussion = await this.communityService.getQuestionDiscussion(questionId);
      this.selectedDiscussion.set(discussion);
    } catch (error) {
      this.errorMessage.set(this.authService.readError(error, 'Discussion could not be loaded.'));
    }
  }

  async postDiscussionReply(): Promise<void> {
    const questionId = this.selectedQuestionId();
    const content = this.discussionReply().trim();
    if (!questionId || content.length < 2) {
      this.errorMessage.set('Pick a question and write a reply first.');
      return;
    }

    try {
      await this.communityService.createDiscussionPost(questionId, content);
      this.discussionReply.set('');
      this.successMessage.set('Discussion reply posted.');
      await this.selectQuestion(questionId);
      await this.loadNotifications();
    } catch (error) {
      this.errorMessage.set(this.authService.readError(error, 'Reply could not be posted.'));
    }
  }

  async loadPeers(): Promise<void> {
    try {
      const peers = await this.communityService.searchPeers(this.peerSearch().trim() || undefined);
      this.peerResults.set(peers);
    } catch (error) {
      this.errorMessage.set(this.authService.readError(error, 'Peer search failed.'));
    }
  }

  async sendPeerRequest(peer: PeerSearchResult): Promise<void> {
    try {
      await this.communityService.requestPeer(peer.id);
      this.successMessage.set('Peer request sent.');
      await this.refreshPeerData();
    } catch (error) {
      this.errorMessage.set(this.authService.readError(error, 'Peer request failed.'));
    }
  }

  async respondPeer(connection: PeerConnection, action: 'accept' | 'decline' | 'block'): Promise<void> {
    try {
      await this.communityService.respondPeer(connection.id, action);
      this.successMessage.set(`Peer request ${action === 'accept' ? 'accepted' : 'updated'}.`);
      await this.refreshPeerData();
    } catch (error) {
      this.errorMessage.set(this.authService.readError(error, 'Peer response failed.'));
    }
  }

  async startAudioCall(): Promise<void> {
    const peerUserId = this.callPeerId() ?? this.acceptedConnections()[0]?.peer.id ?? null;
    if (!peerUserId) {
      this.errorMessage.set('Accept a peer connection before starting an audio call.');
      return;
    }

    try {
      const call = await this.communityService.createAudioCall({ peerUserId });
      await this.preparePeerConnection(call);
      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);
      const description = this.peerConnection!.localDescription;
      if (description) {
        await this.communityService.sendCallSignal(call.id, 'offer', {
          description: {
            type: description.type,
            sdp: description.sdp,
          },
        });
      }

      this.callStatus.set('Offer sent');
      this.startSignalPolling(call.id);
      await this.loadCalls();
    } catch (error) {
      this.cleanupAudio(false);
      this.errorMessage.set(this.authService.readError(error, 'Audio call could not start.'));
    }
  }

  async joinAudioCall(call: AudioCallRoom): Promise<void> {
    try {
      await this.preparePeerConnection(call);
      this.callStatus.set('Joining call');
      this.startSignalPolling(call.id);
      await this.pollCallSignals(call.id);
    } catch (error) {
      this.cleanupAudio(false);
      this.errorMessage.set(this.authService.readError(error, 'Audio call could not be joined.'));
    }
  }

  async endAudioCall(): Promise<void> {
    const call = this.activeCall();
    if (call) {
      try {
        await this.communityService.sendCallSignal(call.id, 'hangup', {});
      } catch {
        // Local cleanup should still happen even if the final signal cannot be sent.
      }
    }

    this.cleanupAudio(true);
    await this.loadCalls();
  }

  async proposeEvent(): Promise<void> {
    const peerUserId = this.eventPeerId() ?? this.acceptedConnections()[0]?.peer.id ?? null;
    if (!peerUserId) {
      this.errorMessage.set('Accept a peer connection before proposing a study session.');
      return;
    }

    try {
      await this.communityService.proposeEvent({
        peerUserId,
        title: this.eventTitle().trim() || 'Focused study session',
        agenda: this.eventAgenda().trim() || undefined,
        startsAt: this.toApiDate(this.eventStartsAt()),
        endsAt: this.toApiDate(this.eventEndsAt()),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
      });
      this.successMessage.set('Study session proposed.');
      await this.loadCalendar();
    } catch (error) {
      this.errorMessage.set(this.authService.readError(error, 'Study session proposal failed.'));
    }
  }

  async confirmEvent(event: CollaborationEvent): Promise<void> {
    try {
      await this.communityService.confirmEvent(event.id);
      this.successMessage.set('Study session confirmed.');
      await this.loadCalendar();
    } catch (error) {
      this.errorMessage.set(this.authService.readError(error, 'Confirmation failed.'));
    }
  }

  showReschedule(event: CollaborationEvent): void {
    this.rescheduleEventId.set(this.rescheduleEventId() === event.id ? null : event.id);
  }

  async requestReschedule(event: CollaborationEvent): Promise<void> {
    try {
      await this.communityService.requestReschedule(event.id, {
        startsAt: this.toApiDate(this.rescheduleStartsAt()),
        endsAt: this.toApiDate(this.rescheduleEndsAt()),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
        reason: this.rescheduleReason().trim() || undefined,
      });
      this.successMessage.set('Reschedule request sent.');
      this.rescheduleEventId.set(null);
      await this.loadCalendar();
    } catch (error) {
      this.errorMessage.set(this.authService.readError(error, 'Reschedule request failed.'));
    }
  }

  async respondReschedule(requestId: string, action: 'accept' | 'decline'): Promise<void> {
    try {
      await this.communityService.respondReschedule(requestId, action);
      this.successMessage.set(`Reschedule ${action === 'accept' ? 'accepted' : 'declined'}.`);
      await this.loadCalendar();
    } catch (error) {
      this.errorMessage.set(this.authService.readError(error, 'Reschedule response failed.'));
    }
  }

  async syncCalendar(event: CollaborationEvent, provider: 'google' | 'outlook'): Promise<void> {
    try {
      await this.communityService.syncCalendar(event.id, provider);
      this.successMessage.set(`${provider} calendar sync queued.`);
      await this.loadNotifications();
    } catch (error) {
      this.errorMessage.set(this.authService.readError(error, 'Calendar sync failed.'));
    }
  }

  async markNotificationRead(notification: CollaborationNotification): Promise<void> {
    try {
      await this.communityService.markNotificationRead(notification.id);
      await this.loadNotifications();
    } catch (error) {
      this.errorMessage.set(this.authService.readError(error, 'Notification update failed.'));
    }
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  formatTime(value: string): string {
    return new Intl.DateTimeFormat('en-IN', {
      timeStyle: 'short',
    }).format(new Date(value));
  }

  private async refreshPeerData(): Promise<void> {
    const [peers, connections] = await Promise.all([
      this.communityService.searchPeers(this.peerSearch().trim() || undefined),
      this.communityService.listPeerConnections(),
    ]);
    this.peerResults.set(peers);
    this.connections.set(connections);
    this.setDefaultPeerSelections();
  }

  private async loadCalendar(): Promise<void> {
    this.calendarEvents.set(await this.communityService.listCalendarEvents());
  }

  private async loadCalls(): Promise<void> {
    this.audioCalls.set(await this.communityService.listAudioCalls());
  }

  private async loadNotifications(): Promise<void> {
    this.notifications.set(await this.communityService.listNotifications());
  }

  private setDefaultPeerSelections(): void {
    const firstPeer = this.acceptedConnections()[0]?.peer.id ?? null;
    if (!this.callPeerId()) {
      this.callPeerId.set(firstPeer);
    }
    if (!this.eventPeerId()) {
      this.eventPeerId.set(firstPeer);
    }
  }

  private async preparePeerConnection(call: AudioCallRoom): Promise<void> {
    this.cleanupAudio(false);
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Audio capture is not available in this browser.');
    }

    this.activeCall.set(call);
    this.lastSignalAt = null;
    this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    for (const track of this.localStream.getTracks()) {
      peerConnection.addTrack(track, this.localStream);
    }

    peerConnection.ontrack = (event) => {
      const audioElement = this.remoteAudio?.nativeElement;
      if (audioElement && event.streams[0]) {
        audioElement.srcObject = event.streams[0];
      }
    };

    peerConnection.onicecandidate = (event) => {
      const activeCall = this.activeCall();
      if (!activeCall || !event.candidate) {
        return;
      }

      this.communityService
        .sendCallSignal(activeCall.id, 'ice-candidate', {
          candidate: {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            usernameFragment: event.candidate.usernameFragment,
          },
        })
        .catch(() => {
          this.callStatus.set('ICE signal retry needed');
        });
    };

    this.peerConnection = peerConnection;
    this.callStatus.set('Audio ready');
  }

  private startSignalPolling(callId: string): void {
    if (this.pollTimer) {
      window.clearInterval(this.pollTimer);
    }

    this.pollTimer = window.setInterval(() => {
      this.pollCallSignals(callId).catch(() => {
        this.callStatus.set('Signal polling paused');
      });
    }, 1800);
  }

  private async pollCallSignals(callId: string): Promise<void> {
    const signals = await this.communityService.listCallSignals(callId, this.lastSignalAt ?? undefined);
    await this.processCallSignals(signals);
  }

  private async processCallSignals(signals: CallSignal[]): Promise<void> {
    const peerConnection = this.peerConnection;
    if (!peerConnection) {
      return;
    }

    for (const signal of signals) {
      this.lastSignalAt = signal.createdAt;

      if (signal.messageType === 'hangup') {
        this.callStatus.set('Call ended by peer');
        this.cleanupAudio(true);
        return;
      }

      if (signal.messageType === 'offer') {
        const description = this.readDescription(signal.payload);
        if (!description) {
          continue;
        }

        await peerConnection.setRemoteDescription(description);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        const localDescription = peerConnection.localDescription;
        if (localDescription && this.activeCall()) {
          await this.communityService.sendCallSignal(this.activeCall()!.id, 'answer', {
            description: {
              type: localDescription.type,
              sdp: localDescription.sdp,
            },
          });
          this.callStatus.set('Connected');
        }
      }

      if (signal.messageType === 'answer') {
        const description = this.readDescription(signal.payload);
        if (description && !peerConnection.currentRemoteDescription) {
          await peerConnection.setRemoteDescription(description);
          this.callStatus.set('Connected');
        }
      }

      if (signal.messageType === 'ice-candidate') {
        const candidate = this.readCandidate(signal.payload);
        if (candidate) {
          await peerConnection.addIceCandidate(candidate);
        }
      }
    }
  }

  private readDescription(payload: Record<string, unknown>): RTCSessionDescriptionInit | null {
    const raw = payload['description'];
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    const candidate = raw as Record<string, unknown>;
    if (
      (candidate['type'] === 'offer' || candidate['type'] === 'answer') &&
      typeof candidate['sdp'] === 'string'
    ) {
      return {
        type: candidate['type'],
        sdp: candidate['sdp'],
      };
    }

    return null;
  }

  private readCandidate(payload: Record<string, unknown>): RTCIceCandidateInit | null {
    const raw = payload['candidate'];
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    const candidate = raw as Record<string, unknown>;
    if (typeof candidate['candidate'] !== 'string') {
      return null;
    }

    return {
      candidate: candidate['candidate'],
      sdpMid: typeof candidate['sdpMid'] === 'string' ? candidate['sdpMid'] : null,
      sdpMLineIndex:
        typeof candidate['sdpMLineIndex'] === 'number' ? candidate['sdpMLineIndex'] : null,
      usernameFragment:
        typeof candidate['usernameFragment'] === 'string' ? candidate['usernameFragment'] : undefined,
    };
  }

  private cleanupAudio(resetStatus: boolean): void {
    if (this.pollTimer) {
      window.clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    this.peerConnection?.close();
    this.peerConnection = null;

    for (const track of this.localStream?.getTracks() ?? []) {
      track.stop();
    }
    this.localStream = null;

    const audioElement = this.remoteAudio?.nativeElement;
    if (audioElement) {
      audioElement.srcObject = null;
    }

    this.activeCall.set(null);
    this.lastSignalAt = null;
    if (resetStatus) {
      this.callStatus.set('Idle');
    }
  }

  private toDateTimeLocal(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');
    return [
      date.getFullYear(),
      '-',
      pad(date.getMonth() + 1),
      '-',
      pad(date.getDate()),
      'T',
      pad(date.getHours()),
      ':',
      pad(date.getMinutes()),
    ].join('');
  }

  private toApiDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new Error('Choose a valid date and time.');
    }

    return date.toISOString();
  }
}
