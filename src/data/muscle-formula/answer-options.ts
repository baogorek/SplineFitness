export const jointMovementOptions = {
  hip: [
    { value: "flexion", label: "Flexion" },
    { value: "extension", label: "Extension" },
    { value: "abduction", label: "Abduction" },
    { value: "adduction", label: "Adduction" },
    { value: "medial-rotation", label: "Medial (Internal) Rotation" },
    { value: "lateral-rotation", label: "Lateral (External) Rotation" },
  ],
  knee: [
    { value: "flexion", label: "Flexion" },
    { value: "extension", label: "Extension" },
    { value: "medial-rotation", label: "Medial Rotation" },
    { value: "lateral-rotation", label: "Lateral Rotation" },
  ],
  ankle: [
    { value: "plantar-flexion", label: "Plantar Flexion" },
    { value: "dorsiflexion", label: "Dorsiflexion" },
  ],
  subtalar: [
    { value: "inversion", label: "Inversion" },
    { value: "eversion", label: "Eversion" },
  ],
  scapula: [
    { value: "elevation", label: "Elevation" },
    { value: "depression", label: "Depression" },
    { value: "retraction", label: "Retraction" },
    { value: "protraction", label: "Protraction" },
    { value: "upward-rotation", label: "Upward Rotation" },
    { value: "downward-rotation", label: "Downward Rotation" },
  ],
  shoulder: [
    { value: "flexion", label: "Flexion" },
    { value: "extension", label: "Extension" },
    { value: "abduction", label: "Abduction" },
    { value: "adduction", label: "Adduction" },
    { value: "medial-rotation", label: "Medial (Internal) Rotation" },
    { value: "lateral-rotation", label: "Lateral (External) Rotation" },
    { value: "horizontal-flexion", label: "Horizontal Flexion (Adduction)" },
    { value: "horizontal-extension", label: "Horizontal Extension (Abduction)" },
  ],
  elbow: [
    { value: "flexion", label: "Flexion" },
    { value: "extension", label: "Extension" },
  ],
  radioulnar: [
    { value: "supination", label: "Supination" },
    { value: "pronation", label: "Pronation" },
  ],
  wrist: [
    { value: "flexion", label: "Flexion" },
    { value: "extension", label: "Extension" },
    { value: "radial-deviation", label: "Radial Deviation (Abduction)" },
    { value: "ulnar-deviation", label: "Ulnar Deviation (Adduction)" },
  ],
  spine: [
    { value: "flexion", label: "Flexion" },
    { value: "extension", label: "Extension" },
    { value: "lateral-flexion", label: "Lateral Flexion" },
    { value: "rotation", label: "Rotation" },
  ],
}

export const resistanceTypeOptions = [
  { value: "gravity", label: "Gravity", description: "Free weights, bodyweight exercises" },
  { value: "cable", label: "Cable/Pulley", description: "Cable machines, lat pulldown, etc." },
  { value: "elastic", label: "Elastic Band", description: "Resistance bands, tubes" },
  { value: "machine", label: "Machine", description: "Lever-based or cam machines" },
]

export const resistanceDirectionOptions = [
  { value: "downward", label: "Downward" },
  { value: "upward", label: "Upward" },
  { value: "anterior", label: "Anteriorly (Forward)" },
  { value: "posterior", label: "Posteriorly (Backward)" },
  { value: "medial", label: "Medially (Inward)" },
  { value: "lateral", label: "Laterally (Outward)" },
]

export const muscleActionOptions = [
  { value: "concentric", label: "Concentric", description: "Muscles shorten while producing force" },
  { value: "eccentric", label: "Eccentric", description: "Muscles lengthen while producing force" },
]

export const planeOptions = [
  { value: "sagittal", label: "Sagittal", description: "Divides body into left and right halves" },
  { value: "frontal", label: "Frontal (Coronal)", description: "Divides body into front and back halves" },
  { value: "transverse", label: "Transverse", description: "Divides body into top and bottom halves" },
]

export const axisOptions = [
  { value: "frontal", label: "Frontal (Mediolateral)", description: "Runs side to side through the body" },
  { value: "sagittal", label: "Sagittal (Anteroposterior)", description: "Runs front to back through the body" },
  { value: "longitudinal", label: "Longitudinal (Vertical)", description: "Runs top to bottom through the body" },
]

export const jointSideOptions = [
  { value: "anterior", label: "Anterior (Front)" },
  { value: "posterior", label: "Posterior (Back)" },
  { value: "medial", label: "Medial (Inside)" },
  { value: "lateral", label: "Lateral (Outside)" },
]

export function getMovementOptionsForJoint(joint: string) {
  return jointMovementOptions[joint as keyof typeof jointMovementOptions] || []
}
