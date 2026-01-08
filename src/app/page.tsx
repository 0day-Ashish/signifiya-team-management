'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import Image from "next/image";
import localFont from 'next/font/local'

const bvhBartle = localFont({ src: '../../public/fonts/BBHBartle-Regular.ttf' })
const spaceMono = localFont({ src: '../../public/fonts/SpaceMono-Regular.ttf' })

interface Node {
  id: string;
  type: 'branch' | 'member';
  title?: string;
  parentId?: string | null;
  memberDetails?: {
    name: string;
    bio: string;
    role: string;
    imageUrl?: string;
  };
  children?: Node[];
}

// Simple skeleton blocks used during loading
const SkeletonBox = ({ width = 'w-64', height = 'h-20', rounded = 'rounded-2xl' }: { width?: string; height?: string; rounded?: string }) => (
  <div className={`animate-pulse ${width} ${height} bg-white/10 backdrop-blur-md border border-white/20 ${rounded}`}></div>
);

const SkeletonMindMap = () => (
  <div className="relative z-10 flex flex-col items-center">
    {/* Header space mimic */}
    <div className="text-white text-center mb-24">
      <div className="flex items-baseline justify-center gap-2">
        <SkeletonBox width="w-48" height="h-12" />
        <SkeletonBox width="w-24" height="h-10" />
      </div>
      <div className="mt-6 flex justify-center">
        <SkeletonBox width="w-40" height="h-6" rounded="rounded-xl" />
      </div>
    </div>

    {/* Root node */}
    <div className="flex flex-col items-center">
      <SkeletonBox width="w-64" height="h-14" />
      <div className="h-8 w-px bg-white/20 my-4"></div>
      {/* Children placeholder */}
      <div className="flex gap-8">
        <div className="flex flex-col items-center">
          <div className="h-8 w-px bg-white/20 mb-2"></div>
          <SkeletonBox width="w-56" height="h-24" />
        </div>
        <div className="flex flex-col items-center">
          <div className="h-8 w-px bg-white/20 mb-2"></div>
          <SkeletonBox width="w-56" height="h-24" />
        </div>
        <div className="flex flex-col items-center">
          <div className="h-8 w-px bg-white/20 mb-2"></div>
          <SkeletonBox width="w-56" height="h-24" />
        </div>
      </div>
    </div>
  </div>
);

const TreeBranch = ({ 
  children, 
  isFirst, 
  isLast, 
  isOnly 
}: { 
  children: React.ReactNode; 
  isFirst: boolean; 
  isLast: boolean; 
  isOnly: boolean;
}) => {
  return (
    <div className="flex flex-col items-center relative px-4 shrink-0">
       {/* Horizontal Connector at TOP */}
       {!isOnly && (
          <>
            {/* Line to the Left (if not first) */}
            {!isFirst && <div className="absolute top-0 left-0 w-1/2 h-px bg-white/30"></div>}
            {/* Line to the Right (if not last) */}
            {!isLast && <div className="absolute top-0 right-0 w-1/2 h-px bg-white/30"></div>}
          </>
       )}
       
       {/* Vertical Connector DOWN from line to content */}
       <div className="h-8 w-px bg-white/30"></div>
       
       {children}
    </div>
  );
};

const MindMapNode = ({ 
  node, 
  onAddBranch, 
  onAddMember,
  onEditBranch,
  onEditMember,
  onDeleteNode,
  expandedNodes,
  onToggleNode,
  depth = 0,
  isAdmin = false 
}: { 
  node: Node;
  onAddBranch: (parentId: string) => void;
  onAddMember: (parentId: string) => void;
  onEditBranch: (nodeId: string, newTitle: string) => void;
  onEditMember: (nodeId: string, details: { name: string; role: string; bio: string }) => void;
  onDeleteNode: (nodeId: string) => void;
  expandedNodes: Record<string, boolean>;
  onToggleNode: (id: string, isOpen: boolean) => void;
  depth?: number;
  isAdmin?: boolean;
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const isBranch = node.type === 'branch';
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Derived isOpen state from parent props
  // Members with children default to open, branches default to closed
  const defaultOpen = (node.children && node.children.length > 0 && !isBranch) || false;
  const isOpen = expandedNodes[node.id] !== undefined ? expandedNodes[node.id] : defaultOpen;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as HTMLElement)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const childrenCount = (node.children?.length || 0) + (isBranch ? 1 : 0); // +1 for Action Node only if Branch
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(node.title || '');
  const [editedMember, setEditedMember] = useState({
    name: node.memberDetails?.name || '',
    role: node.memberDetails?.role || '',
    bio: node.memberDetails?.bio || ''
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const memberInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
        if (isBranch && inputRef.current) inputRef.current.focus();
        if (!isBranch && memberInputRef.current) memberInputRef.current.focus();
    }
  }, [isEditing, isBranch]);

  const handleSaveTitle = () => {
    if (editedTitle.trim()) {
        onEditBranch(node.id, editedTitle);
        setIsEditing(false);
    }
  };

  const handleSaveMember = () => {
     onEditMember(node.id, editedMember);
     setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (isBranch) handleSaveTitle();
        else handleSaveMember();
    }
    if (e.key === 'Escape') {
        setEditedTitle(node.title || '');
        setEditedMember({
            name: node.memberDetails?.name || '',
            role: node.memberDetails?.role || '',
            bio: node.memberDetails?.bio || ''
        });
        setIsEditing(false);
    }
  };

  return (
    <div className="flex flex-col items-center relative group/node z-10">
       <div className="relative flex items-center gap-2 z-10">
            {!isBranch ? (
               isEditing ? (
                 <div className="relative animate-in fade-in zoom-in duration-300 z-50">
                    <div className={`p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl w-64 shrink-0 space-y-3 ${spaceMono.className}`}>
                        <input
                            ref={memberInputRef}
                            type="text"
                            value={editedMember.name}
                            onChange={(e) => setEditedMember({...editedMember, name: e.target.value})}
                            placeholder="Name"
                            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-white/30"
                            onKeyDown={handleKeyDown}
                        />
                        <input
                            type="text"
                            value={editedMember.role}
                            onChange={(e) => setEditedMember({...editedMember, role: e.target.value})}
                            placeholder="Role"
                            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white/80 text-xs focus:outline-none focus:border-white/30"
                            onKeyDown={handleKeyDown}
                        />
                        <textarea
                            value={editedMember.bio}
                            onChange={(e) => setEditedMember({...editedMember, bio: e.target.value})}
                            placeholder="Bio"
                            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white/60 text-xs focus:outline-none focus:border-white/30 resize-none h-20"
                            onKeyDown={handleKeyDown}
                        />
                        <div className="flex gap-2 justify-end pt-2">
                             <button onClick={() => setIsEditing(false)} className="text-xs text-white/50 hover:text-white">Cancel</button>
                             <button onClick={handleSaveMember} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded text-white border border-white/20">Save</button>
                        </div>
                    </div>
                 </div>
               ) : (
               <div className="relative animate-in fade-in zoom-in duration-300 group/member">
                    {/* Updated Menu Button for Member */}
                    {isAdmin && (
                    <div className="absolute -top-3 -right-3 z-30 flex gap-2">
                        <div className="relative" ref={dropdownRef}>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }}
                                className="p-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white/70 hover:text-white transition-all opacity-0 group-hover/member:opacity-100"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                                </svg>
                            </button>

                            {/* Dropdown Menu */}
                            {showDropdown && (
                                <div className="absolute top-full right-0 mt-2 w-48 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 z-50">
                                    <button 
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            setEditedMember({
                                                name: node.memberDetails?.name || '',
                                                role: node.memberDetails?.role || '',
                                                bio: node.memberDetails?.bio || ''
                                            });
                                            setIsEditing(true);
                                            setShowDropdown(false);
                                        }}
                                        className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2 transition-colors border-b border-white/10"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                        </svg>
                                        Edit Member
                                    </button>
                                    <button 
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            onAddBranch(node.id); 
                                            setShowDropdown(false);
                                            onToggleNode(node.id, true);
                                        }}
                                        className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                        </svg>
                                        Create Branch
                                    </button>
                                    <button 
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            onDeleteNode(node.id); 
                                            setShowDropdown(false);
                                        }}
                                        className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-white/10 flex items-center gap-2 transition-colors border-t border-white/10"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                        </svg>
                                        Delete Member
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    )}

                    <div className={`p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl w-64 shrink-0 ${spaceMono.className}`}>
                        <div className="flex items-center gap-3 mb-2">
                        {node.memberDetails?.imageUrl ? (
                            <div className="relative w-10 h-10 flex-shrink-0">
                                <Image 
                                    src={node.memberDetails.imageUrl} 
                                    alt={node.memberDetails.name}
                                    fill
                                    className="rounded-full object-cover border border-white/20"
                                />
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                                {node.memberDetails?.name.charAt(0)}
                            </div>
                        )}
                        <div className="min-w-0">
                            <h3 className="text-lg font-bold text-white truncate">{node.memberDetails?.name}</h3>
                            <p className="text-xs text-white/60 uppercase tracking-wider truncate">{node.memberDetails?.role}</p>
                        </div>
                        </div>
                        <p className="text-xs text-white/50 leading-relaxed border-t border-white/10 pt-2 mt-2 break-words">
                        {node.memberDetails?.bio}
                        </p>
                    </div>
                </div>
              )
            ) : isEditing ? (
                 <input
                    ref={inputRef}
                    type="text"
                    value={editedTitle}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onBlur={handleSaveTitle}
                    onKeyDown={handleKeyDown}
                    className={`px-8 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-xl text-white outline-none focus:ring-2 focus:ring-white/30 min-w-[200px] text-center ${spaceMono.className}`}
                  />
            ) : (
                <div 
                    onClick={() => onToggleNode(node.id, !isOpen)}
                    className={`group/node relative flex items-center gap-3 px-8 py-3 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl transition-all duration-300 ${spaceMono.className} z-10 cursor-pointer`}
                >
                    <span className="text-xl tracking-wide text-white">{node.title}</span>
                    
                    {/* Icons inside the box - Visible on hover only for Admins */}
                    {isAdmin && (
                    <div className="flex gap-1 opacity-0 group-hover/node:opacity-100 transition-opacity duration-200">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                            className="p-1 hover:bg-white/20 rounded-full text-white/70 hover:text-white transition-colors"
                            title="Edit"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                            </svg>
                        </button>
                        {depth > 0 && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDeleteNode(node.id); }}
                                className="p-1 hover:bg-red-500/20 rounded-full text-white/70 hover:text-red-300 transition-colors"
                                title="Delete"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                            </button>
                        )}
                    </div>
                    )}

                    <div className={`transform transition-transform text-white duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                    </div>
                </div>
            )}
       </div>

      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="min-h-0 flex flex-col items-center overflow-visible">
            {/* Connector from Parent Node down to the horizontal bus */}
            <div className="h-8 w-px bg-white/30"></div>
            
            {/* Children Container - remove gap since TreeBranch handles spacing via padding */}
             <div className="flex flex-nowrap items-start justify-center">
               {node.children?.map((child, index) => (
                  <TreeBranch 
                    key={child.id}
                    isFirst={index === 0}
                    isLast={false} // Never last because Actions node is always added
                    isOnly={childrenCount === 1}
                  >
                    <MindMapNode 
                      node={child} 
                      onAddBranch={onAddBranch}
                      onAddMember={onAddMember}
                      onEditBranch={onEditBranch}
                      onEditMember={onEditMember}
                      onDeleteNode={onDeleteNode}
                      expandedNodes={expandedNodes}
                      onToggleNode={onToggleNode}
                      depth={depth + 1}
                      isAdmin={isAdmin}
                    />
                  </TreeBranch>
               ))}

               { isBranch && isAdmin && (
               /* Action Buttons Node - Only for Branch type */
               <TreeBranch 
                 isFirst={childrenCount === 1}
                 isLast={true}
                 isOnly={childrenCount === 1}
               >
                 <div className="flex gap-6">
                   {/* Option 1: Add Member */}
                   <div className="flex flex-col items-center relative shrink-0">
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 h-8 w-px bg-white/30"></div>
                       {/* Horizontal bracket for actions */}
                      <div className="absolute -top-8 left-1/2 w-[calc(50%+0.75rem)] h-px bg-white/30"></div>
                      
                      <button 
                        onClick={() => onAddMember(node.id)}
                        className={`px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/20 rounded-xl transition-all whitespace-nowrap text-sm text-white ${spaceMono.className}`}
                      >
                        + Member
                      </button>
                   </div>

                   {/* Option 2: Create Branch */}
                   <div className="flex flex-col items-center relative shrink-0">
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 h-8 w-px bg-white/30"></div>
                       {/* Horizontal bracket for actions */}
                       <div className="absolute -top-8 right-1/2 w-[calc(50%+0.75rem)] h-px bg-white/30"></div>

                      <button 
                        onClick={() => onAddBranch(node.id)}
                        className={`px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/20 rounded-xl transition-all whitespace-nowrap text-sm text-white ${spaceMono.className}`}
                      >
                        + Branch
                      </button>
                   </div>
                 </div>
               </TreeBranch>
               )}
             </div>
        </div>
      </div>
    </div>
  );
};


export default function Home() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(false); // UI toggle for login modal
  
  // Auth state
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Loading state for initial fetch
  const [isLoading, setIsLoading] = useState(true);
  
  const [treeData, setTreeData] = useState<Node | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const toggleNode = useCallback((id: string, isOpen: boolean) => {
    setExpandedNodes(prev => ({ ...prev, [id]: isOpen }));
  }, []);

  // Check auth status on mount
  useEffect(() => {
    fetch('/api/auth/check')
        .then(res => res.json())
        .then(data => {
            if (data.isAdmin) setIsAdmin(true);
        })
        .catch(err => console.error("Auth check failed", err));
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const email = formData.get('email');
      const password = formData.get('password');

      try {
          const res = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password })
          });
          
          if (res.ok) {
              setIsAdmin(true);
              setIsAdminLogin(false);
          } else {
              alert("Invalid credentials");
          }
      } catch (err) {
          alert("Login failed");
      }
  };

  const handleLogout = async () => {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        setIsAdmin(false);
    } catch (err) {
        console.error("Logout failed", err);
    }
  };

  const fetchTree = useCallback(async () => {
    try {
      setIsLoading(true);
        const res = await fetch('/api/nodes');
        if (!res.ok) {
            console.error("API response not ok:", res.status, res.statusText);
            throw new Error(`Failed to fetch nodes: ${res.statusText}`);
        }
        const rawData = await res.json();
        
        if (!Array.isArray(rawData)) {
             console.error("API returned non-array data:", rawData);
             // If we get an object (like error), treat it as empty or handle it.
             // For now, let's assuming empty if invalid to trigger root creation maybe?
             // Or better, just throw.
             throw new Error("Invalid data format received from API");
        }
        
        // Map raw DB flat structure to UI nested structure
        const nodes: Node[] = rawData.map((item: any) => ({
            id: item.id,
            type: item.type as 'branch' | 'member',
            title: item.title,
            parentId: item.parentId,
            children: [],
            memberDetails: item.type === 'member' ? {
                name: item.name,
                bio: item.bio,
                role: item.role,
                imageUrl: item.imageUrl
            } : undefined
        }));
        
        // Convert flat list to tree
        const buildTree = (mappedNodes: Node[]) => {
            const nodeMap = new Map<string, Node>();
            let rootNode: Node | null = null;
            
            // First pass: create nodes and map
            mappedNodes.forEach(node => {
                nodeMap.set(node.id, { ...node, children: [] });
            });
            
            // Second pass: link children
            mappedNodes.forEach(node => {
               // We need to use the object from the map to ensure references are shared
               const currentNode = nodeMap.get(node.id)!;
               
               if (!node.parentId) {
                   rootNode = currentNode;
               } else {
                   const parent = nodeMap.get(node.parentId);
                   if (parent && parent.children) {
                       parent.children.push(currentNode);
                   }
               }
            });
            
            return rootNode;
        };
        
        const tree = buildTree(nodes);
        if (tree) {
            setTreeData(tree);
        } else {
             // Initialize default root if DB is empty
             const rootRes = await fetch('/api/nodes', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ type: 'branch', title: 'Leads' })
             });
             const rootData = await rootRes.json();
             // Map the single root response too
             setTreeData({
                id: rootData.id,
                type: rootData.type,
                title: rootData.title,
                children: []
             });
        }
    } catch (err) {
        console.error("Failed to fetch tree:", err);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  // Scroll to center when data loads
  useEffect(() => {
    if (!isLoading && treeData && scrollRef.current) {
        requestAnimationFrame(() => {
            if (scrollRef.current) {
                const { scrollWidth, clientWidth, scrollHeight, clientHeight } = scrollRef.current;
                scrollRef.current.scrollLeft = (scrollWidth - clientWidth) / 2;
                scrollRef.current.scrollTop = (scrollHeight - clientHeight) / 2;
            }
        });
    }
  }, [isLoading]); // Depend on loading state finishing

  const [memberModal, setMemberModal] = useState({
    isOpen: false,
    parentId: ''
  });
  const [newMember, setNewMember] = useState({ name: '', bio: '', role: '', imageUrl: '' });

  const handleAddBranch = async (parentId: string) => {
    try {
      setIsLoading(true);
        await fetch('/api/nodes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                type: 'branch', 
                title: 'New Branch',
                parentId 
            })
        });
        fetchTree();
    } catch(err) {
        console.error("Failed to create branch", err);
    }
  };

  const openMemberModal = (parentId: string) => {
    setMemberModal({ isOpen: true, parentId });
    setNewMember({ name: '', bio: '', role: '', imageUrl: '' });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewMember(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const submitMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
        await fetch('/api/nodes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'member',
                parentId: memberModal.parentId,
                memberDetails: newMember
            })
        });
        fetchTree();
        setMemberModal({ isOpen: false, parentId: '' });
    } catch(err) {
        console.error("Failed to add member", err);
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    // If root, don't delete (though UI prevents it too)
    if (nodeId === treeData?.id) return;
    
    try {
        setIsLoading(true);
        await fetch(`/api/nodes/${nodeId}`, { method: 'DELETE' });
        fetchTree();
    } catch(err) {
        console.error("Failed to delete node", err);
    }
  };

  const handleEditBranch = async (nodeId: string, newTitle: string) => {
    try {
      setIsLoading(true);
        await fetch(`/api/nodes/${nodeId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: newTitle })
        });
        fetchTree();
    } catch(err) {
        console.error("Failed to edit node", err);
    }
  };
  const handleEditMember = async (nodeId: string, details: { name: string, role: string, bio: string }) => {
    try {
        setIsLoading(true);
        await fetch(`/api/nodes/${nodeId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(details)
        });
        fetchTree();
    } catch(err) {
        console.error("Failed to edit member", err);
    }
  };
  if (isLoading && !treeData) {
      return (
        <main className="relative h-screen w-full overflow-hidden bg-zinc-950">
          <div className="fixed inset-0 bg-[url('/background-pg.jpg')] bg-cover bg-center bg-no-repeat pointer-events-none" />
          <div className="absolute inset-0 overflow-auto flex">
            <div className="min-w-fit w-fit m-auto min-h-full px-40 py-20">
              <SkeletonMindMap />
            </div>
          </div>
        </main>
      );
  }

  return (
    <main className="relative h-screen w-full overflow-hidden bg-zinc-950">
      <div className="fixed inset-0 bg-[url('/background-pg.jpg')] bg-cover bg-center bg-no-repeat pointer-events-none" />

      <div ref={scrollRef} className="absolute inset-0 overflow-auto flex cursor-grab active:cursor-grabbing">
        <div className="min-w-fit w-fit m-auto min-h-full p-[2500px] relative flex flex-col items-center">
            
            {/* Scrollable Header - Centered Layout */}
            <div className="text-white text-center mb-24 relative z-10">
                    <div className="flex items-baseline justify-center gap-2">
                        <h1 className={`text-6xl font-bold ${bvhBartle.className}`}>
                        SIGNIFIYA
                        </h1>
                        <p className={`text-4xl ${bvhBartle.className}`}>
                        2026
                        </p>
                    </div>
                    <p className={`text-2xl mt-6 ${spaceMono.className}`}>
                    Team Details
                    </p>
            </div>

            <div className="relative z-10">
                {treeData && (
                    <MindMapNode 
                    node={treeData} 
                    onAddBranch={handleAddBranch}
                    onAddMember={openMemberModal}
                    onEditBranch={handleEditBranch}                    onEditMember={handleEditMember}                    onDeleteNode={handleDeleteNode}
                    expandedNodes={expandedNodes}
                    onToggleNode={toggleNode}
                    isAdmin={isAdmin}
                    />
                )}
            </div>
        </div>
      </div>
      
      {/* Login Button - Only show if NOT logged in */}
      {!isAdmin && (
      <button 
        onClick={() => setIsAdminLogin(true)}
        className="absolute top-0 right-0 m-8 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-white transition-all z-10"
        aria-label="Admin Login"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      </button>
      )}

      {/* Logout Button - Only show if IS logged in */}
      {isAdmin && (
      <button 
        onClick={handleLogout}
        className="absolute top-0 right-0 m-8 p-2 bg-red-500/20 hover:bg-red-500/40 backdrop-blur-sm border border-red-200/30 rounded-full text-white transition-all z-10"
        aria-label="Admin Logout"
        title="Logout"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
        </svg>
      </button>
      )}

      {/* Admin Login Modal */}
      {isAdminLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md p-8 bg-black/30 border border-white/20 backdrop-blur-md rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setIsAdminLogin(false)} 
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h2 className={`text-3xl text-white mb-8 text-center ${bvhBartle.className}`}>
              Admin Login
            </h2>
            
            <form className="space-y-6" onSubmit={handleLogin}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80 ml-1">Email</label>
                <input 
                  type="email" 
                  name="email"
                  required 
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all"
                  placeholder="admin@signifiya.com" 
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80 ml-1">Password</label>
                <input 
                  type="password"
                  name="password" 
                  required 
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all" 
                  placeholder="••••••••" 
                />
              </div>
              
              <button 
                type="submit" 
                className="w-full py-3 mt-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-white/5"
              >
                Sign In
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {memberModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md p-8 bg-black/80 border border-white/20 backdrop-blur-md rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200">
             <button 
              onClick={() => setMemberModal({ ...memberModal, isOpen: false })} 
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className={`text-2xl text-white mb-6 text-center ${spaceMono.className}`}>Add Team Member</h2>
            <form className="space-y-4" onSubmit={submitMember}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80 ml-1">Profile Image</label>
                <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                        {newMember.imageUrl ? (
                            <Image src={newMember.imageUrl} alt="Preview" fill className="object-cover" />
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white/40">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                        )}
                    </div>
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="w-full text-sm text-white/80
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-xl file:border-0
                        file:text-sm file:font-semibold
                        file:bg-white/10 file:text-white
                        hover:file:bg-white/20
                        cursor-pointer"
                    />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80 ml-1">Name</label>
                <input 
                  type="text" 
                  required 
                  value={newMember.name}
                  onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80 ml-1">Role</label>
                <input 
                  type="text" 
                  required 
                  value={newMember.role}
                  onChange={(e) => setNewMember({...newMember, role: e.target.value})}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80 ml-1">Bio</label>
                <textarea 
                  required 
                  value={newMember.bio}
                  onChange={(e) => setNewMember({...newMember, bio: e.target.value})}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 h-24 resize-none"
                />
              </div>
              <button 
                type="submit" 
                className="w-full py-3 mt-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl transition-all"
              >
                Add Member
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
