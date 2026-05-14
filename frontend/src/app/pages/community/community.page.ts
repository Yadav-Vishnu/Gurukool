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

@Component({
  selector: 'app-community-page',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  template: `
    <ion-header translucent="true">
      <ion-toolbar>
        <ion-title>Community</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="outline" (click)="refreshAll()" [disabled]="loading()">
            {{ loading() ? 'Refreshing...' : 'Refresh' }}
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <div class="page-shell stack community-shell">
        <section class="glass-card hero-card stack">
          <span class="section-kicker">Phase 5 - Community & Collaboration</span>
          <h1>Discuss questions, connect with peers, and schedule study calls.</h1>
          <p class="muted-copy">
            Forums are question-tagged, peer access is approval-based, and audio signaling is
            protected by your active Gurukool session.
          </p>
        </section>

        <ion-note color="success" *ngIf="successMessage()">{{ successMessage() }}</ion-note>
        <ion-note color="danger" *ngIf="errorMessage()">{{ errorMessage() }}</ion-note>

        <section class="glass-card stack">
          <div class="section-header">
            <div>
              <h2>Question Forum</h2>
              <p class="muted-copy">Pick a tagged question and join its discussion.</p>
            </div>
            <ion-button size="small" fill="outline" (click)="loadQuestions()">Search</ion-button>
          </div>

          <ion-item lines="none">
            <ion-label position="stacked">Search questions</ion-label>
            <ion-input
              [ngModel]="questionSearch()"
              (ngModelChange)="questionSearch.set(toText($event))"
              placeholder="ONGC, ESE, matrices, aptitude">
            </ion-input>
          </ion-item>

          <div class="question-list">
            <button
              type="button"
              class="question-row"
              *ngFor="let question of questions()"
              [class.active]="selectedQuestionId() === question.id"
              (click)="selectQuestion(question.id)">
              <strong>{{ question.subject.code }} - {{ question.sourceTag.examCode }}</strong>
              <span>
                {{ question.sourceTag.companyName || 'General' }}
                <ng-container *ngIf="question.sourceTag.examYear">
                  - {{ question.sourceTag.examYear }}
                </ng-container>
                - {{ question.discussionCount }} replies
              </span>
              <p>{{ question.prompt }}</p>
            </button>
          </div>

          <div class="discussion-panel" *ngIf="selectedDiscussion() as discussion">
            <h3>{{ discussion.question.subject.name }}</h3>
            <div class="post-list" *ngIf="discussion.posts.length; else noDiscussionPosts">
              <article class="post-row" *ngFor="let post of discussion.posts">
                <strong>{{ post.author.fullName }}</strong>
                <span>{{ formatDate(post.createdAt) }}</span>
                <p>{{ post.content }}</p>
              </article>
            </div>

            <ion-item lines="none">
              <ion-label position="stacked">Reply</ion-label>
              <ion-textarea
                auto-grow="true"
                [ngModel]="discussionReply()"
                (ngModelChange)="discussionReply.set(toText($event))"
                placeholder="Ask a doubt, explain your method, or add a reference.">
              </ion-textarea>
            </ion-item>
            <ion-button expand="block" (click)="postDiscussionReply()">Post Reply</ion-button>
          </div>
        </section>

        <section class="glass-card stack">
          <div class="section-header">
            <div>
              <h2>Peer Connect</h2>
              <p class="muted-copy">Find students, send requests, and approve incoming invites.</p>
            </div>
            <ion-button size="small" fill="outline" (click)="loadPeers()">Search</ion-button>
          </div>

          <ion-item lines="none">
            <ion-label position="stacked">Search peers</ion-label>
            <ion-input
              [ngModel]="peerSearch()"
              (ngModelChange)="peerSearch.set(toText($event))"
              placeholder="Name or email">
            </ion-input>
          </ion-item>

          <div class="peer-grid">
            <article class="compact-row" *ngFor="let peer of peerResults()">
              <div>
                <strong>{{ peer.fullName }}</strong>
                <span>{{ peer.connectionStatus || 'not connected' }}</span>
              </div>
              <ion-button
                size="small"
                [disabled]="!!peer.connectionStatus"
                (click)="sendPeerRequest(peer)">
                Connect
              </ion-button>
            </article>
          </div>

          <div class="connection-list">
            <article class="compact-row" *ngFor="let connection of connections()">
              <div>
                <strong>{{ connection.peer.fullName }}</strong>
                <span>{{ connection.status }} - {{ connection.direction }}</span>
              </div>
              <div class="inline-actions" *ngIf="connection.status === 'pending' && connection.direction === 'incoming'">
                <ion-button size="small" (click)="respondPeer(connection, 'accept')">Accept</ion-button>
                <ion-button size="small" fill="outline" color="medium" (click)="respondPeer(connection, 'decline')">
                  Decline
                </ion-button>
              </div>
            </article>
          </div>
        </section>

        <section class="glass-card stack">
          <div class="section-header">
            <div>
              <h2>Secure Audio Calls</h2>
              <p class="muted-copy">Start or join a WebRTC audio room with an accepted peer.</p>
            </div>
            <ion-badge color="secondary">{{ callStatus() }}</ion-badge>
          </div>

          <ion-item lines="none">
            <ion-label position="stacked">Peer</ion-label>
            <ion-select
              interface="popover"
              [ngModel]="callPeerId()"
              (ngModelChange)="setCallPeerId($event)">
              <ion-select-option *ngFor="let connection of acceptedConnections()" [value]="connection.peer.id">
                {{ connection.peer.fullName }}
              </ion-select-option>
            </ion-select>
          </ion-item>

          <div class="actions-two">
            <ion-button expand="block" (click)="startAudioCall()">Start Call</ion-button>
            <ion-button expand="block" fill="outline" color="medium" (click)="endAudioCall()" [disabled]="!activeCall()">
              End Call
            </ion-button>
          </div>

          <audio #remoteAudio autoplay></audio>

          <div class="call-list">
            <article class="compact-row" *ngFor="let call of audioCalls()">
              <div>
                <strong>{{ call.peer.fullName }}</strong>
                <span>{{ call.status }} - {{ formatDate(call.createdAt) }}</span>
              </div>
              <ion-button
                size="small"
                fill="outline"
                [disabled]="call.status === 'ended'"
                (click)="joinAudioCall(call)">
                Join
              </ion-button>
            </article>
          </div>
        </section>

        <section class="glass-card stack">
          <div class="section-header">
            <div>
              <h2>Study Calendar</h2>
              <p class="muted-copy">Propose, confirm, reschedule, and queue external calendar syncs.</p>
            </div>
          </div>

          <ion-item lines="none">
            <ion-label position="stacked">Peer</ion-label>
            <ion-select
              interface="popover"
              [ngModel]="eventPeerId()"
              (ngModelChange)="setEventPeerId($event)">
              <ion-select-option *ngFor="let connection of acceptedConnections()" [value]="connection.peer.id">
                {{ connection.peer.fullName }}
              </ion-select-option>
            </ion-select>
          </ion-item>
          <ion-item lines="none">
            <ion-label position="stacked">Title</ion-label>
            <ion-input [ngModel]="eventTitle()" (ngModelChange)="eventTitle.set(toText($event))"></ion-input>
          </ion-item>
          <ion-item lines="none">
            <ion-label position="stacked">Agenda</ion-label>
            <ion-textarea
              auto-grow="true"
              [ngModel]="eventAgenda()"
              (ngModelChange)="eventAgenda.set(toText($event))">
            </ion-textarea>
          </ion-item>

          <div class="datetime-grid">
            <ion-item lines="none">
              <ion-label position="stacked">Starts</ion-label>
              <ion-input
                type="datetime-local"
                [ngModel]="eventStartsAt()"
                (ngModelChange)="eventStartsAt.set(toText($event))">
              </ion-input>
            </ion-item>
            <ion-item lines="none">
              <ion-label position="stacked">Ends</ion-label>
              <ion-input
                type="datetime-local"
                [ngModel]="eventEndsAt()"
                (ngModelChange)="eventEndsAt.set(toText($event))">
              </ion-input>
            </ion-item>
          </div>

          <ion-button expand="block" (click)="proposeEvent()">Propose Study Session</ion-button>

          <div class="event-list">
            <article class="event-row" *ngFor="let event of calendarEvents()">
              <div>
                <strong>{{ event.title }}</strong>
                <span>{{ event.peer.fullName }} - {{ event.status }}</span>
                <p>{{ formatDate(event.startsAt) }} to {{ formatTime(event.endsAt) }}</p>
              </div>

              <div class="actions-two">
                <ion-button size="small" (click)="confirmEvent(event)" [disabled]="event.status === 'confirmed'">
                  Confirm
                </ion-button>
                <ion-button size="small" fill="outline" color="secondary" (click)="showReschedule(event)">
                  Reschedule
                </ion-button>
              </div>

              <div class="actions-two">
                <ion-button size="small" fill="outline" (click)="syncCalendar(event, 'google')">
                  Google Sync
                </ion-button>
                <ion-button size="small" fill="outline" (click)="syncCalendar(event, 'outlook')">
                  Outlook Sync
                </ion-button>
              </div>

              <div class="reschedule-box" *ngIf="rescheduleEventId() === event.id">
                <div class="datetime-grid">
                  <ion-item lines="none">
                    <ion-label position="stacked">New starts</ion-label>
                    <ion-input
                      type="datetime-local"
                      [ngModel]="rescheduleStartsAt()"
                      (ngModelChange)="rescheduleStartsAt.set(toText($event))">
                    </ion-input>
                  </ion-item>
                  <ion-item lines="none">
                    <ion-label position="stacked">New ends</ion-label>
                    <ion-input
                      type="datetime-local"
                      [ngModel]="rescheduleEndsAt()"
                      (ngModelChange)="rescheduleEndsAt.set(toText($event))">
                    </ion-input>
                  </ion-item>
                </div>
                <ion-item lines="none">
                  <ion-label position="stacked">Reason</ion-label>
                  <ion-input
                    [ngModel]="rescheduleReason()"
                    (ngModelChange)="rescheduleReason.set(toText($event))">
                  </ion-input>
                </ion-item>
                <ion-button expand="block" color="secondary" (click)="requestReschedule(event)">
                  Send Reschedule
                </ion-button>
              </div>

              <div class="reschedule-box" *ngIf="event.pendingReschedule as pending">
                <strong>Pending reschedule</strong>
                <p>{{ formatDate(pending.proposedStartsAt) }} to {{ formatTime(pending.proposedEndsAt) }}</p>
                <div class="actions-two" *ngIf="pending.requestedByUserId !== userId()">
                  <ion-button size="small" (click)="respondReschedule(pending.id, 'accept')">Accept</ion-button>
                  <ion-button size="small" fill="outline" color="medium" (click)="respondReschedule(pending.id, 'decline')">
                    Decline
                  </ion-button>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section class="glass-card stack">
          <div class="section-header">
            <div>
              <h2>Notifications</h2>
              <p class="muted-copy">In-app notifications are stored in PostgreSQL and queued in Redis.</p>
            </div>
          </div>

          <div class="notification-list" *ngIf="notifications().length; else noNotifications">
            <article class="compact-row" *ngFor="let notification of notifications()" [class.unread]="!notification.isRead">
              <div>
                <strong>{{ notification.title }}</strong>
                <span>{{ notification.body }}</span>
              </div>
              <ion-button
                size="small"
                fill="outline"
                [disabled]="notification.isRead"
                (click)="markNotificationRead(notification)">
                Read
              </ion-button>
            </article>
          </div>
        </section>
      </div>
    </ion-content>

    <ng-template #noDiscussionPosts>
      <p class="muted-copy">No replies yet. Start the discussion.</p>
    </ng-template>

    <ng-template #noNotifications>
      <p class="muted-copy">No notifications yet.</p>
    </ng-template>
  `,
  styles: [`
    .community-shell {
      padding-top: 88px;
    }

    .hero-card {
      margin: 0;
    }

    h1 {
      margin: 12px 0 8px;
      font-size: clamp(1.9rem, 4.8vw, 3.15rem);
      line-height: 1;
      color: var(--ion-color-dark);
    }

    h2,
    h3 {
      margin: 0;
      color: var(--ion-color-dark);
    }

    h2 {
      font-size: 1.15rem;
    }

    h3 {
      font-size: 1rem;
    }

    .section-header {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      justify-content: space-between;
    }

    .question-list,
    .post-list,
    .peer-grid,
    .connection-list,
    .call-list,
    .event-list,
    .notification-list {
      display: grid;
      gap: 12px;
    }

    .question-row,
    .compact-row,
    .post-row,
    .event-row {
      border: 1px solid var(--gk-outline);
      border-radius: 14px;
      background: rgba(248, 250, 255, 0.78);
      padding: 12px;
    }

    .question-row {
      display: grid;
      gap: 6px;
      width: 100%;
      text-align: left;
      color: inherit;
    }

    .question-row.active {
      border-color: rgba(30, 136, 229, 0.62);
      background: rgba(230, 242, 255, 0.72);
    }

    .question-row span,
    .compact-row span,
    .post-row span,
    .event-row span {
      color: var(--gk-muted);
      font-size: 0.86rem;
    }

    .question-row p,
    .post-row p,
    .event-row p {
      margin: 0;
      color: var(--ion-color-dark);
      line-height: 1.55;
    }

    .discussion-panel {
      display: grid;
      gap: 12px;
      border-top: 1px dashed var(--gk-outline);
      padding-top: 14px;
    }

    .compact-row {
      display: grid;
      gap: 10px;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
    }

    .compact-row.unread {
      border-color: rgba(244, 109, 67, 0.42);
      background: rgba(255, 244, 235, 0.7);
    }

    .inline-actions,
    .actions-two,
    .datetime-grid {
      display: grid;
      gap: 10px;
    }

    .event-row {
      display: grid;
      gap: 12px;
    }

    .reschedule-box {
      display: grid;
      gap: 10px;
      border-top: 1px dashed var(--gk-outline);
      padding-top: 12px;
    }

    ion-item {
      --background: rgba(255, 255, 255, 0.72);
      --border-radius: 14px;
      border: 1px solid var(--gk-outline);
      border-radius: 14px;
    }

    audio {
      width: 100%;
      min-height: 44px;
    }

    @media (min-width: 768px) {
      .actions-two,
      .datetime-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `],
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
  private pollTimer: ReturnType<typeof window.setInterval> | null = null;
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
