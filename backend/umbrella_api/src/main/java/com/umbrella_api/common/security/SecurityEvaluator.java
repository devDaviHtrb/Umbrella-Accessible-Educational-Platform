package com.umbrella_api.common.security;

import com.umbrella_api.modules.course.api.CourseService;
import com.umbrella_api.modules.course.model.CourseUserRelation;
import com.umbrella_api.modules.course.model.Courses;
import com.umbrella_api.modules.user.model.UserModel;
import org.springframework.stereotype.Component;
import com.umbrella_api.modules.ai.api.AiService;
import com.umbrella_api.modules.ai.model.IaChat;

@Component("securityEvaluator")
public class SecurityEvaluator {

    private final AiService aiService;
    private final CourseService courseService;

    public SecurityEvaluator(AiService aiService, CourseService courseService) {
        this.aiService = aiService;
        this.courseService = courseService;
    }


    public boolean isChatOwner(Long chatId, CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUserModel() == null) {
            return false;
        }

        IaChat chat = aiService.getChatById(chatId);
        return chat != null
                && chat.getUser() != null
                && chat.getUser().getId().equals(userDetails.getUserModel().getId());
    }

    public boolean isCourseOwner(Long courseId, CustomUserDetails userDetails){
        if (userDetails == null || userDetails.getUserModel() == null) {
            return false;
        }

        Courses course = courseService.getCourseById(courseId);
        UserModel creator = courseService.getCourseCreatorById(courseId);
        return course != null
                && creator != null
                && creator.getId().equals(userDetails.getUserModel().getId());
    }


    public boolean isSameUser(Long userId, CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUserModel() == null) {
            return false;
        }
        return userDetails.getUserModel().getId().equals(userId);
    }
}