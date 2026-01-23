import React from 'react';

export interface ProjectSection {
  id: string;
  title: string;
  content: string;
}

export interface TechItem {
  name: string;
  role: string;
  icon?: React.ReactNode;
}

export interface MaturityLayer {
  level: number;
  name: string;
  description: string;
}