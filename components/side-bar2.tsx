import { Book, Bot, ChevronDown, ChevronsUpDown, Frame, FrameIcon, GalleryVerticalEnd, LucideGalleryThumbnails, Map, MoreHorizontal, PieChart, Settings, Terminal } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "./ui/sidebar"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "./ui/collapsible" // ✅ Use your UI wrapper

const data = [
  {
    label: "Orc Warrior Ground",
    icon: Terminal,
    items: ["History", "Starred", "Settings"]
  },
  {
    label: "Models",
    icon: Bot,
    items: ["Genesis", "Explorer", "Quantum"]
  },
  {
    label: "Documentation",
    icon: Book,
    items: ["Introduction", "Get Started", "Tutorials", "Changelog"]
  },
  {
    label: "Settings",
    icon: Settings,
    items: ["General", "Team", "Billings", "Limits"]
  }
]

const projects = [
  {
    icon: FrameIcon, 
    label: "Design Engineering"
  },
  {
    icon: PieChart, 
    label: "Sales & Marketing"
  },
  {
    icon: Map, 
    label: "Travel"
  },
  {
    icon: MoreHorizontal, 
    label: "More"
  }
]

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size={"lg"}>
              <div className="aspect-square size-8 rounded-sm text-sidebar-primary-foreground grid place-items-center bg-primary relative">
                <LucideGalleryThumbnails className="size-4"/>
              </div>
              <div className="flex flex-col">
                <span className="font-medium">Documentation</span>
                <span>v.2.0.1</span>
              </div>
              <ChevronsUpDown className="ml-auto"/>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="bg-white">
        <SidebarGroup>
        <SidebarGroupLabel>Platform</SidebarGroupLabel>
        <SidebarMenu>
            {
              data.map(({icon: Icon, ...element}, idx) => {
                return (
                  <Collapsible key={idx} asChild className="group/collapsible">
                    <SidebarMenuItem  className="text-gray-700">
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                          <Icon />
                          {element.label  }
                          <ChevronDown className="ml-auto transition-transform -rotate-90 group-data-[state=open]/collapsible:rotate-0"/>
                        </SidebarMenuButton>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {
                            element.items.map((item, idx) => {
                              return (
                                <SidebarMenuSubItem key={idx} >
                                  <SidebarMenuSubButton className="text-gray-700 transition-colors duration-200">{item}</SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              )
                            })
                          }
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )
              })
            }
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
          <SidebarMenu>
            {
              projects.map(({icon: Icon, ...project}, idx) => {
                return (
                    <SidebarMenuItem key={idx}>
                        <SidebarMenuButton>
                          <Icon/>
                          {project.label}
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                )
              })
            }
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
