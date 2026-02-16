import { Injectable } from '@angular/core';
import * as SockJS from 'sockjs-client';
import { Client, IMessage } from '@stomp/stompjs';
import { Subject } from 'rxjs';
import { ChatMessage } from '../models/chat-message.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class VideoChatService {
  private stompClient: Client | null = null;
  private connected = false;
  
  // primljene poruke
  public messages$ = new Subject<ChatMessage>();
  
  constructor(private authService: AuthService) {}

  connectToVideoChat(videoId: string, username: string): void {
    const token = this.authService.getToken();
    
    this.stompClient = new Client({
      webSocketFactory: () => {
        // Add token as query parameter for SockJS
        const url = token 
          ? `http://localhost:8080/video-chat?token=${encodeURIComponent(token)}`
          : 'http://localhost:8080/video-chat';
        return new SockJS(url) as any;
      },
      connectHeaders: token ? {
        'Authorization': `Bearer ${token}`
      } : {},
      debug: (str) => {
        console.log('STOMP: ' + str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        this.connected = true;
        console.log('Connected to video chat for video:', videoId);
        
        this.stompClient?.subscribe(`/topic/video/${videoId}/chat`, (message: IMessage) => {
          const chatMessage: ChatMessage = JSON.parse(message.body);
          this.messages$.next(chatMessage);
        });
        
        this.sendJoinNotification(videoId, username);
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
      }
    });
    
    this.stompClient.activate();
  }

  sendMessage(videoId: string, username: string, message: string): void {
    if (this.connected && this.stompClient?.connected) {
      const chatMessage: ChatMessage = {
        message: message,
        username: username,
        videoId: videoId,
        timestamp: new Date().toISOString()
      };
      
      this.stompClient.publish({
        destination: `/app/video/${videoId}/chat`,
        body: JSON.stringify(chatMessage)
      });
    }
  }

  private sendJoinNotification(videoId: string, username: string): void {
    const joinMsg: ChatMessage = {
      message: '',
      username: username,
      videoId: videoId,
      timestamp: new Date().toISOString()
    };
    
    this.stompClient?.publish({
      destination: `/app/video/${videoId}/join`,
      body: JSON.stringify(joinMsg)
    });
  }

  disconnect(videoId: string, username: string): void {
    if (this.connected && this.stompClient?.connected) {
      const leaveMsg: ChatMessage = {
        message: '',
        username: username,
        videoId: videoId,
        timestamp: new Date().toISOString()
      };
      
      this.stompClient.publish({
        destination: `/app/video/${videoId}/leave`,
        body: JSON.stringify(leaveMsg)
      });
      
      this.stompClient.deactivate();
      this.connected = false;
      console.log('Disconnected from video chat');
    }
  }
}