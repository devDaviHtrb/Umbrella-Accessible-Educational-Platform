package com.umbrella_api.modules.ai.api;

import com.umbrella_api.modules.ai.dto.AiResponse;

public interface AiService {
    public AiResponse requestAi(String text);

}
