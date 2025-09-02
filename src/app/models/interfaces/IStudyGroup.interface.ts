export interface IStudyGroup {
    id: string;
    name: string;
    description: string;
    creatorId: string;
    max_members: number;
    is_private: boolean;
    invite_code: string;
    status: string;
    faculty: string;
    course: string;
    year_of_study: string;
    created_at: string;
    updated_at: string;
    scheduled_start: string;
    scheduled_end: string;
    meeting_times: string[];
    is_scheduled: boolean;
}