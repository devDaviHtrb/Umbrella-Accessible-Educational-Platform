package com.umbrella_api.common.WebSocket;

import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.WebSocketSession;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WebSocketSessionManager {
    private final Map<Long, Set<WebSocketSession>> sessions = new ConcurrentHashMap<>();

    public void add(long user_id, WebSocketSession session){
        sessions.computeIfAbsent(
                user_id,
                key -> ConcurrentHashMap.newKeySet()
        ).add(session);
    }

    public void remove(Long user_id, WebSocketSession session) {
        Set<WebSocketSession> user_sessions = sessions.get(user_id);

        if (user_sessions == null)
            return;

        user_sessions.remove(session);

        if(user_sessions.isEmpty())
            sessions.remove(user_id);
    }

    public Set<WebSocketSession> getSessionsByUserId(Long user_id){
        return sessions.getOrDefault(user_id, Collections.emptySet());
    }

}
