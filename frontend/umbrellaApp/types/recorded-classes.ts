export type RecordedCategory = {
    id: string;
    label: string;
  };
  
  export type RecordedLesson = {
    id: string;
    categoryId: string;
    category: string;
    title: string;
    description: string;
    durationLabel: string;
    dateLabel: string;
    imageTone: string;
  };