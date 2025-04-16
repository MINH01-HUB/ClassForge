// Student Types
export interface Student {
    id: string
    name: string
    academicScore: number
    wellbeingScore: number
    socioeconomicStatus: number
    specialNeeds: boolean
    relationships: Relationship[]
  }
  
  export interface Relationship {
    targetStudentId: string
    type: RelationshipType
    strength: number
  }
  
  export enum RelationshipType {
    Friendship = "friendship",
    Advice = "advice",
    Influence = "influence",
    Disrespect = "disrespect",
    Activity = "activity",
  }
  
  // Classroom Types
  export interface Classroom {
    id: string
    name: string
    capacity: number
    students: Student[]
  }
  
  // Allocation Types
  export interface AllocationParameters {
    academicBalanceWeight: number
    wellbeingDistributionWeight: number
    friendshipRetentionWeight: number
    behavioralConsiderationsWeight: number
    constraints: AllocationConstraints
    advancedSettings: AdvancedSettings
  }
  
  export interface AllocationConstraints {
    maxClassSize: number
    maintainGenderBalance: boolean
    distributeSpecialNeeds: boolean
    separateConflicts: boolean
  }
  
  export interface AdvancedSettings {
    useReinforcementLearning: boolean
    useGraphNeuralNetworks: boolean
    useGeneticAlgorithms: boolean
    enableNLP: boolean
  }
  
  export interface AllocationResult {
    classrooms: Classroom[]
    metrics: AllocationMetrics
  }
  
  export interface AllocationMetrics {
    academicBalance: number
    wellbeingDistribution: number
    friendshipRetention: number
    conflictReduction: number
  }
  