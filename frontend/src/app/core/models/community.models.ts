export interface PublicUser {
  id: string;
  fullName: string;
  avatarUrl: string | null;
}

export interface DiscussionQuestion {
  id: string;
  prompt: string;
  subject: {
    code: string;
    name: string;
  };
  topic: {
    name: string;
    slug: string;
  } | null;
  sourceTag: {
    examCode: 'GATE' | 'PSU' | 'ESE';
    companyName: string | null;
    paperCode: string | null;
    examYear: number | null;
    isPyq: boolean;
  };
  discussionCount: number;
}

export interface DiscussionPost {
  id: string;
  parentPostId: string | null;
  content: string;
  isDeleted: boolean;
  createdAt: string;
  author: PublicUser;
}

export interface QuestionDiscussion {
  thread: {
    id: string;
    questionId: string;
    createdAt: string;
  };
  question: DiscussionQuestion;
  posts: DiscussionPost[];
}

export interface PeerSearchResult extends PublicUser {
  connectionId: string | null;
  connectionStatus: 'pending' | 'accepted' | 'declined' | 'blocked' | null;
}

export interface PeerConnection {
  id: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  requestedAt: string;
  respondedAt: string | null;
  requester: PublicUser;
  addressee: PublicUser;
  peer: PublicUser;
  direction: 'incoming' | 'outgoing';
}

export interface PendingReschedule {
  id: string;
  requestedByUserId: string;
  proposedStartsAt: string;
  proposedEndsAt: string;
  timezone: string;
  reason: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
}

export interface CollaborationEvent {
  id: string;
  title: string;
  agenda: string | null;
  startsAt: string;
  endsAt: string;
  timezone: string;
  status: 'proposed' | 'confirmed' | 'reschedule_requested' | 'cancelled' | 'completed';
  requesterConfirmed: boolean;
  inviteeConfirmed: boolean;
  myRole: 'requester' | 'invitee';
  peer: PublicUser;
  pendingReschedule: PendingReschedule | null;
}

export interface AudioCallRoom {
  id: string;
  status: 'ringing' | 'active' | 'ended' | 'missed';
  roomKey: string;
  eventId: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  peer: PublicUser;
  myRole: 'caller' | 'callee';
}

export interface CallSignal {
  id: string;
  callId: string;
  senderUserId: string;
  messageType: 'offer' | 'answer' | 'ice-candidate' | 'hangup';
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface CollaborationNotification {
  id: string;
  notificationType: string;
  title: string;
  body: string;
  channel: 'in_app' | 'email' | 'push';
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  deliverAfter: string;
  createdAt: string;
  actor: PublicUser | null;
}

export interface ProposeEventPayload {
  peerUserId: string;
  title: string;
  agenda?: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
}

export interface ReschedulePayload {
  startsAt: string;
  endsAt: string;
  timezone: string;
  reason?: string;
}
