"use client"

import { useState } from "react"
import { ImportBookmarksDialog } from "@/components/admin/import-bookmarks-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FileDown, FileUp, Database, ChevronDown } from "lucide-react"
import { useTranslations } from "next-intl"

export default function DataManagementPage() {
  const t = useTranslations("admin.data")
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* 导入数据 - 主要操作 */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded">
                <FileUp className="h-5 w-5 text-primary" />
              </div>
              {t("importTitle")}
            </CardTitle>
            <CardDescription>
              {t("importDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setImportDialogOpen(true)}
              className="w-full"
              size="lg"
            >
              <FileUp className="mr-2 h-4 w-4" />
              {t("startImport")}
            </Button>
          </CardContent>
        </Card>

        {/* 导出数据 - 辅助功能 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-muted rounded">
                <FileDown className="h-5 w-5" />
              </div>
              {t("exportTitle")}
            </CardTitle>
            <CardDescription>
              {t("exportDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  {t("selectFormat")}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => window.open('/api/data/export', '_blank')}>
                  <div className="flex flex-col items-start gap-1">
                    <span className="font-medium">{t("jsonBackup")}</span>
                    <span className="text-xs text-muted-foreground">{t("jsonBackupDesc")}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open('/api/data/export?mode=full', '_blank')}>
                  <div className="flex flex-col items-start gap-1">
                    <span className="font-medium">{t("fullBackup")}</span>
                    <span className="text-xs text-muted-foreground">{t("fullBackupDesc")}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open('/api/bookmarks/export', '_blank')}>
                  <div className="flex flex-col items-start gap-1">
                    <span className="font-medium">{t("chromeBookmark")}</span>
                    <span className="text-xs text-muted-foreground">{t("chromeBookmarkDesc")}</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardContent>
        </Card>
      </div>

      {/* 说明卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            {t("guideTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-sm">
          {/* 导入模式 */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <span className="text-lg">📥</span>
              {t("importModeTitle")}
            </h4>
            <div className="grid gap-3 md:grid-cols-2 ml-7">
              <div className="p-3 rounded-lg border bg-muted/30">
                <p className="font-medium text-foreground mb-1">{t("appendMode")}</p>
                <p className="text-muted-foreground text-xs">{t("appendModeDesc")}</p>
              </div>
              <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                <p className="font-medium text-destructive mb-1">{t("overwriteMode")}</p>
                <p className="text-muted-foreground text-xs">{t("overwriteModeDesc")}</p>
              </div>
            </div>
          </div>

          {/* 导入格式 */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <span className="text-lg">📄</span>
              {t("formatsTitle")}
            </h4>
            <div className="space-y-3 ml-7">
              {/* JSON格式 */}
              <div className="p-3 rounded-lg border border-blue-600/20 bg-blue-500/5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-blue-600 font-semibold">{t("jsonRecommended")}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{t("fullDataBadge")}</span>
                </div>
                <p className="text-muted-foreground text-xs">{t("jsonFullDesc")}</p>
              </div>

              {/* Chrome书签格式 */}
              <div className="p-3 rounded-lg border border-muted bg-muted/30">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{t("chromeBookmark")}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{t("chromeBadge")}</span>
                </div>
                <div className="space-y-2">
                  <p className="text-muted-foreground text-xs">
                    <span className="font-medium">{t("exportLabel")}</span>{t("exportDescDetail")}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    <span className="font-medium">{t("importLabel")}</span>{t("importDescDetail")}
                  </p>
                </div>

                {/* 多层嵌套说明 - 仅导入时 */}
                <div className="mt-2 p-2 rounded bg-background/50 border-l-2 border-muted-foreground/30">
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    <span className="font-medium">{t("nestedTitle")}</span>{t("nestedDesc")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 安全提示 */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              {t("safetyTitle")}
            </h4>
            <div className="ml-7 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
              <p className="text-destructive text-xs font-medium mb-1">{t("safetyLead")}</p>
              <p className="text-muted-foreground text-xs mb-2">{t("safetyDesc")}</p>
              <p className="text-muted-foreground text-xs"><strong>{t("safetyStats")}</strong>{t("safetyStatsDesc")}</p>
            </div>
          </div>

          {/* 数据对比 */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <span className="text-lg">📊</span>
              {t("compareTitle")}
            </h4>
            <div className="ml-7 overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">{t("thField")}</th>
                    <th className="text-center p-2 font-medium">{t("thJson")}</th>
                    <th className="text-center p-2 font-medium">{t("thChrome")}</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b">
                    <td className="p-2">{t("fieldName")}</td>
                    <td className="text-center p-2">✅</td>
                    <td className="text-center p-2">✅</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">{t("fieldUrl")}</td>
                    <td className="text-center p-2">✅</td>
                    <td className="text-center p-2">✅</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">{t("fieldDesc")}</td>
                    <td className="text-center p-2 text-blue-600 dark:text-blue-400 font-semibold">✅</td>
                    <td className="text-center p-2">❌</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">{t("fieldOrder")}</td>
                    <td className="text-center p-2 text-blue-600 dark:text-blue-400 font-semibold">✅</td>
                    <td className="text-center p-2">❌</td>
                  </tr>
                  <tr>
                    <td className="p-2">{t("fieldPublished")}</td>
                    <td className="text-center p-2 text-blue-600 dark:text-blue-400 font-semibold">✅</td>
                    <td className="text-center p-2">❌</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 导入/导出对话框 */}
      <ImportBookmarksDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />
    </div>
  )
}
