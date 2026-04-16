import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Project.yml template for Unicontrol — Belgian Lambert 72
const PROJECT_YML_LAMBERT72 = (werfName: string) => `Geodesy:
  CoordinateSystem: Lambert72-BD72.wkt
  Geoid: hBG18.gtx
  RadioCoordinateSystem: Lambert72-BD72.wkt
  RadioGeoid: hBG18.gtx
JobSetup:
  ProjectUnit: m
  Background: ''
  PassiveBackground: ''
  JobType: Flat
  JobHistory: []
Design:
  LastKnownPosition:
    x: 0.0000
    y: 0.0000
    z: 0.0000
  DynamicDemoDisplace: false
Simulator:
  JumpToProject: true
  SimulatorPosition:
    x: 150000.0000
    y: 50.0000
    z: 170000.0000
SimulatorNMEA:
  JumpToProject: true
  SimulatorPosition:
    x: 150000.0000
    y: 50.0000
    z: 170000.0000
LogPoint:
  HiddenPointCodes: []
  ShowSharedLogPoints: false
  attribute_1_state: 0
  attribute_1_defaultValue: ''
  attribute_1_fieldname: ''
  attribute_2_state: 0
  attribute_2_defaultValue: ''
  attribute_2_fieldname: ''
  attribute_3_state: 0
  attribute_3_defaultValue: ''
  attribute_3_fieldname: ''
  ChangePointNameState: 0
  ChangePointNameValue: ''
  ChangePointCodeState: 0
  ChangePointCodeValue: ''
  ManualHeightOffsetState: 0
  ManualHeightOffsetDefaultValue: 0.0000
  popupMode: 3
SideReference:
  SideOffset: 0.0000
HeightOffset:
  GPSOffset: 0.0000
  GPSOffsetE: 0.0000
  GPSOffsetN: 0.0000
`

// POST: Create a new werf (project folder) on a machine
// This uploads a Project.yml to Supabase storage for the sync script to pick up
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const machineId = parseInt(id)
  if (isNaN(machineId)) return NextResponse.json({ error: 'Ongeldig ID' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { name } = await req.json()
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Werfnaam is verplicht' }, { status: 400 })
  }

  // Sanitize name — only allow safe folder characters
  const safeName = name.trim().replace(/[<>:"/\\|?*]/g, '_')
  if (safeName.length === 0) {
    return NextResponse.json({ error: 'Ongeldige werfnaam' }, { status: 400 })
  }

  const adminSupabase = createAdminClient()

  // Verify machine ownership or admin
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const isAdmin = profile?.role === 'admin'

  const machineQuery = adminSupabase
    .from('machines')
    .select('id, name, user_id, guidance_system')
    .eq('id', machineId)
  if (!isAdmin) machineQuery.eq('user_id', user.id)

  const { data: machine } = await machineQuery.single()
  if (!machine) return NextResponse.json({ error: 'Machine niet gevonden' }, { status: 404 })

  // Generate Project.yml content
  const ymlContent = PROJECT_YML_LAMBERT72(safeName)
  const ymlBuffer = Buffer.from(ymlContent, 'utf-8')
  const storagePath = `machine-${machineId}/${safeName}/Project.yml`

  // Upload Project.yml to storage
  const { error: uploadError } = await adminSupabase.storage
    .from('machine-files')
    .upload(storagePath, ymlBuffer, {
      contentType: 'text/yaml',
      upsert: true,
    })

  if (uploadError) {
    return NextResponse.json({ error: `Upload mislukt: ${uploadError.message}` }, { status: 500 })
  }

  // Log as transfer so sync script picks it up
  await adminSupabase
    .from('machine_file_transfers')
    .insert({
      machine_id: machineId,
      uploaded_by: user.id,
      file_name: 'Project.yml',
      storage_path: storagePath,
      file_size: ymlBuffer.length,
      subfolder: safeName,
      status: 'pending',
    })

  return NextResponse.json({ werf: safeName })
}

// GET: List werven (unique subfolders) for a machine
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const machineId = parseInt(id)
  if (isNaN(machineId)) return NextResponse.json({ error: 'Ongeldig ID' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const adminSupabase = createAdminClient()

  // List all files in machine folder to find subfolders
  const { data: files } = await adminSupabase.storage
    .from('machine-files')
    .list(`machine-${machineId}`, { limit: 1000 })

  // Subfolders = items with id ending in / or items that are folders
  const werven = (files || [])
    .filter(f => f.id && !f.name.includes('.'))
    .map(f => f.name)

  return NextResponse.json({ werven })
}
