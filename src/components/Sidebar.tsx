import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Home, MessageSquare, BarChart3, Users, FileText, Database, Settings, ChevronLeft, ChevronRight, Download, Aperture, UserCircle, Lock } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import * as configService from '../services/config'

import './Sidebar.scss'

interface SidebarUserProfile {
  wxid: string
  displayName: string
  avatarUrl?: string
}

function Sidebar() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [authEnabled, setAuthEnabled] = useState(false)
  const [userProfile, setUserProfile] = useState<SidebarUserProfile>({
    wxid: '',
    displayName: '未识别用户'
  })
  const setLocked = useAppStore(state => state.setLocked)

  useEffect(() => {
    window.electronAPI.auth.verifyEnabled().then(setAuthEnabled)
  }, [])

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const wxid = await configService.getMyWxid()
        let displayName = wxid || '未识别用户'

        const normalizeName = (value?: string | null): string | undefined => {
          if (!value) return undefined
          const trimmed = value.trim()
          if (!trimmed || trimmed.toLowerCase() === 'self') return undefined
          return trimmed
        }

        let enrichedDisplayName: string | undefined
        let fallbackSelfName: string | undefined

        if (wxid) {
          const [myContact, enrichedResult] = await Promise.all([
            window.electronAPI.chat.getContact(wxid),
            window.electronAPI.chat.enrichSessionsContactInfo([wxid, 'self'])
          ])

          enrichedDisplayName = normalizeName(enrichedResult.contacts?.[wxid]?.displayName)
          fallbackSelfName = normalizeName(enrichedResult.contacts?.self?.displayName)

          const bestName =
            normalizeName(myContact?.remark) ||
            normalizeName(myContact?.nickName) ||
            normalizeName(myContact?.alias) ||
            enrichedDisplayName ||
            fallbackSelfName

          if (bestName) {
            displayName = bestName
          } else if (fallbackSelfName && fallbackSelfName !== wxid) {
            displayName = fallbackSelfName
          }
        }

        let avatarUrl: string | undefined
        const avatarResult = await window.electronAPI.chat.getMyAvatarUrl()
        if (avatarResult.success && avatarResult.avatarUrl) {
          avatarUrl = avatarResult.avatarUrl
        }

        setUserProfile({
          wxid: wxid || '',
          displayName,
          avatarUrl
        })
      } catch (error) {
        console.error('加载侧边栏用户信息失败:', error)
      }
    }

    void loadCurrentUser()
    const onWxidChanged = () => { void loadCurrentUser() }
    window.addEventListener('wxid-changed', onWxidChanged as EventListener)
    return () => window.removeEventListener('wxid-changed', onWxidChanged as EventListener)
  }, [])

  const getAvatarLetter = (name: string): string => {
    if (!name) return '?'
    return [...name][0] || '?'
  }

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <nav className="nav-menu">
        {/* 首页 */}
        <NavLink
          to="/home"
          className={`nav-item ${isActive('/home') ? 'active' : ''}`}
          title={collapsed ? '首页' : undefined}
        >
          <span className="nav-icon"><Home size={20} /></span>
          <span className="nav-label">首页</span>
        </NavLink>

        {/* 聊天 */}
        <NavLink
          to="/chat"
          className={`nav-item ${isActive('/chat') ? 'active' : ''}`}
          title={collapsed ? '聊天' : undefined}
        >
          <span className="nav-icon"><MessageSquare size={20} /></span>
          <span className="nav-label">聊天</span>
        </NavLink>

        {/* 朋友圈 */}
        <NavLink
          to="/sns"
          className={`nav-item ${isActive('/sns') ? 'active' : ''}`}
          title={collapsed ? '朋友圈' : undefined}
        >
          <span className="nav-icon"><Aperture size={20} /></span>
          <span className="nav-label">朋友圈</span>
        </NavLink>

        {/* 通讯录 */}
        <NavLink
          to="/contacts"
          className={`nav-item ${isActive('/contacts') ? 'active' : ''}`}
          title={collapsed ? '通讯录' : undefined}
        >
          <span className="nav-icon"><UserCircle size={20} /></span>
          <span className="nav-label">通讯录</span>
        </NavLink>

        {/* 私聊分析 */}
        <NavLink
          to="/analytics"
          className={`nav-item ${isActive('/analytics') ? 'active' : ''}`}
          title={collapsed ? '私聊分析' : undefined}
        >
          <span className="nav-icon"><BarChart3 size={20} /></span>
          <span className="nav-label">私聊分析</span>
        </NavLink>

        {/* 群聊分析 */}
        <NavLink
          to="/group-analytics"
          className={`nav-item ${isActive('/group-analytics') ? 'active' : ''}`}
          title={collapsed ? '群聊分析' : undefined}
        >
          <span className="nav-icon"><Users size={20} /></span>
          <span className="nav-label">群聊分析</span>
        </NavLink>

        {/* 年度报告 */}
        <NavLink
          to="/annual-report"
          className={`nav-item ${isActive('/annual-report') ? 'active' : ''}`}
          title={collapsed ? '年度报告' : undefined}
        >
          <span className="nav-icon"><FileText size={20} /></span>
          <span className="nav-label">年度报告</span>
        </NavLink>

        {/* 导出 */}
        <NavLink
          to="/export"
          className={`nav-item ${isActive('/export') ? 'active' : ''}`}
          title={collapsed ? '导出' : undefined}
        >
          <span className="nav-icon"><Download size={20} /></span>
          <span className="nav-label">导出</span>
        </NavLink>


      </nav>

      <div className="sidebar-footer">
        <div
          className="sidebar-user-card"
          title={collapsed ? `${userProfile.displayName}${userProfile.wxid ? `\n${userProfile.wxid}` : ''}` : undefined}
        >
          <div className="user-avatar">
            {userProfile.avatarUrl ? <img src={userProfile.avatarUrl} alt="" /> : <span>{getAvatarLetter(userProfile.displayName)}</span>}
          </div>
          <div className="user-meta">
            <div className="user-name">{userProfile.displayName}</div>
            <div className="user-wxid">{userProfile.wxid || 'wxid 未识别'}</div>
          </div>
        </div>

        {authEnabled && (
          <button
            className="nav-item"
            onClick={() => setLocked(true)}
            title={collapsed ? '锁定' : undefined}
          >
            <span className="nav-icon"><Lock size={20} /></span>
            <span className="nav-label">锁定</span>
          </button>
        )}

        <NavLink
          to="/settings"
          className={`nav-item ${isActive('/settings') ? 'active' : ''}`}
          title={collapsed ? '设置' : undefined}
        >
          <span className="nav-icon">
            <Settings size={20} />
          </span>
          <span className="nav-label">设置</span>
        </NavLink>

        <button
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? '展开菜单' : '收起菜单'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
