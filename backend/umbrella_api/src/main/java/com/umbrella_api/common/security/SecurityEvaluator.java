package com.umbrella_api.common.security;

import com.umbrella_api.modules.activity.api.ActivityService;
import com.umbrella_api.modules.course.api.CourseService;
import com.umbrella_api.modules.course.model.Courses;
import com.umbrella_api.modules.submissions.api.SubmissionService;
import com.umbrella_api.modules.user.model.UserModel;
import org.springframework.stereotype.Component;
import com.umbrella_api.modules.ai.api.AiService;
import com.umbrella_api.modules.ai.model.IaChat;

@Component("securityEvaluator")
public class SecurityEvaluator {

    private final AiService aiService;
    private final CourseService courseService;
    private final ActivityService activityService;
    private final SubmissionService submissionService;

    public SecurityEvaluator(AiService aiService, CourseService courseService, ActivityService activityService, SubmissionService submissionService) {
        this.aiService = aiService;
        this.courseService = courseService;
        this.activityService = activityService;
        this.submissionService = submissionService;
    }

    public boolean isNotLoggedUser(CustomUserDetails userDetails){
        return userDetails == null || userDetails.getUserModel() == null;
    }

    public boolean isChatOwner(Long chatId, CustomUserDetails userDetails) {
        if(isNotLoggedUser(userDetails)){
            return false;
        };

        IaChat chat = aiService.getChatById(chatId);
        return chat != null
                && chat.getUser() != null
                && chat.getUser().getId().equals(userDetails.getUserModel().getId());
    }

    public boolean isCourseOwner(Long courseId, CustomUserDetails userDetails){
        if(isNotLoggedUser(userDetails)){
            return false;
        };

        Courses course = courseService.getCourseById(courseId);
        UserModel creator = courseService.getCourseCreatorById(courseId);
        return course != null
                && creator != null
                && creator.getId().equals(userDetails.getUserModel().getId());
    }


    public boolean isSameUser(Long userId, CustomUserDetails userDetails) {
        if(isNotLoggedUser(userDetails)){
            return false;
        };
        return userDetails.getUserModel().getId().equals(userId);
    }
}