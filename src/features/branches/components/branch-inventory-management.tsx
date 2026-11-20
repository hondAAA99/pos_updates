'use client'

import { Eye, Pencil, Trash2, X } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useAuth } from '@/features/auth/providers/auth-provider'
import { useRouter } from '@/i18n/navigation'
import { ApiClientError } from '@/lib/api-client'
import { formatNumber } from '@/lib/format'
import { listBranchesFromApi } from '../services/branches-api-service'
import {
  deleteBranchInventoryItem,
  getBranchInventoryItem,
  listBranchInventory,
  updateBranchInventoryItem,
} from '../services/branch-inventory-service'
import type { Branch } from '../types/branch'
import type {
  BranchInventoryPage,
  BranchInventoryRecord,
} from '../types/branch-inventory'
const pageSizes = [5, 10, 20] as const

export function BranchInventoryManagement() {
  const t = useTranslations('branchInventory')
  const branchT = useTranslations('branchManagement')
  const locale = useLocale() === 'ar' ? 'ar' : 'en'
  const router = useRouter()
  const { token, user, logout } = useAuth()
  const isAdmin = user?.role === 'admin'
  const canManage = Boolean(isAdmin)
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [inventory, setInventory] = useState<BranchInventoryPage>({
    items: [],
    page: 1,
    pageSize: 5,
    totalItems: 0,
    totalPages: 0,
  })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<(typeof pageSizes)[number]>(5)
  const [viewingRecord, setViewingRecord] =
    useState<BranchInventoryRecord | null>(null)
  const [editingRecord, setEditingRecord] =
    useState<BranchInventoryRecord | null>(null)
  const [deletingRecord, setDeletingRecord] =
    useState<BranchInventoryRecord | null>(null)
  const [quantity, setQuantity] = useState('')
  const [formError, setFormError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const [branchesError, setBranchesError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isBranchesLoading, setIsBranchesLoading] = useState(Boolean(isAdmin))
  const [branchesLoadFailed, setBranchesLoadFailed] = useState(false)
  const [isDetailLoading, setIsDetailLoading] = useState(false)

  const handleApiError = useCallback(
    (caught: unknown, fallback: string) => {
      setError(
        caught instanceof ApiClientError && caught.status === 401
          ? t('feedback.unauthorized')
          : fallback,
      )
      if (caught instanceof ApiClientError && caught.status === 401) {
        logout()
        router.replace('/login')
      }
    },
    [logout, router, t],
  )

  const loadBranchOptions = useCallback(async () => {
    if (!token || !isAdmin) {
      setBranches([])
      setIsBranchesLoading(false)
      return
    }

    try {
      setIsBranchesLoading(true)
      setBranchesLoadFailed(false)
      setBranchesError('')
      const nextBranches = await listBranchesFromApi(token)
      setBranches(nextBranches)
      setSelectedBranchId(current =>
        nextBranches.some(branch => branch._id === current) ? current : '',
      )
    } catch (caught) {
      setBranchesLoadFailed(true)
      setBranches([])
      setSelectedBranchId('')
      setBranchesError(
        caught instanceof ApiClientError && caught.status === 401
          ? t('feedback.unauthorized')
          : t('feedback.branchesError'),
      )
      handleApiError(caught, t('feedback.branchesError'))
    } finally {
      setIsBranchesLoading(false)
    }
  }, [handleApiError, isAdmin, t, token])

  const loadInventory = useCallback(
    async (
      nextPage = page,
      nextPageSize = pageSize,
      nextBranchId = selectedBranchId,
    ) => {
      if (!token) {
        setInventory({
          items: [],
          page: 1,
          pageSize: nextPageSize,
          totalItems: 0,
          totalPages: 0,
        })
        setIsLoading(false)
        return
      }

      const requestedBranchId = isAdmin
        ? branches.find(branch => branch._id === nextBranchId)?._id
        : user?.branchId
      if (!requestedBranchId || requestedBranchId === 'admin') {
        setInventory({
          items: [],
          page: 1,
          pageSize: nextPageSize,
          totalItems: 0,
          totalPages: 0,
        })
        setError('')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError('')
        const result = await listBranchInventory(token, {
          page: nextPage,
          limit: nextPageSize,
          branchId: requestedBranchId,
        })
        setInventory(result)
        const lastPage = Math.max(1, result.totalPages)
        if (nextPage > lastPage) setPage(lastPage)
      } catch (caught) {
        handleApiError(caught, t('feedback.loadError'))
      } finally {
        setIsLoading(false)
      }
    },
    [
      branches,
      handleApiError,
      isAdmin,
      page,
      pageSize,
      selectedBranchId,
      t,
      token,
      user?.branchId,
    ],
  )

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadBranchOptions()
  }, [loadBranchOptions])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadInventory(page, pageSize, selectedBranchId)
  }, [loadInventory, page, pageSize, selectedBranchId])

  function loadInventoryDetail(record: BranchInventoryRecord) {
    const branchId = isAdmin ? selectedBranchId : user?.branchId
    const productId = record.productId
    if (!token || !branchId || !productId) {
      throw new Error(
        'Branch inventory details require a branch ID and product ID.',
      )
    }

    return getBranchInventoryItem(token, branchId, productId._id)
  }

  async function handleView(record: BranchInventoryRecord) {
    if (!token) return
    try {
      setIsDetailLoading(true)
      setError('')
      setViewingRecord(await loadInventoryDetail(record))
    } catch (caught) {
      handleApiError(caught, t('feedback.detailsError'))
    } finally {
      setIsDetailLoading(false)
    }
  }

  function openEdit(record: BranchInventoryRecord) {
    if (!canManage) return
    setEditingRecord(record)
    setQuantity(String(record.branchQuantity))
    setFormError('')
  }

  async function saveQuantity() {
    if (!editingRecord || !token || !canManage) return
    const parsedQuantity = Number(quantity)
    if (
      !quantity.trim() ||
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity < 0
    ) {
      setFormError(t('form.validation.quantity'))
      return
    }

    try {
      await updateBranchInventoryItem(token, editingRecord._id, parsedQuantity)
      setFeedback(t('feedback.updated'))
      setEditingRecord(null)
      setFormError('')
      await loadInventory(page, pageSize, selectedBranchId)
      if (viewingRecord?._id === editingRecord._id) {
        setViewingRecord(await loadInventoryDetail(editingRecord))
      }
    } catch (caught) {
      handleApiError(caught, t('feedback.updateError'))
    }
  }

  async function confirmDelete() {
    if (!deletingRecord || !token || !canManage) return
    try {
      await deleteBranchInventoryItem(token, deletingRecord._id)
      setFeedback(t('feedback.deleted'))
      setDeletingRecord(null)
      setViewingRecord(null)
      await loadInventory(page, pageSize, selectedBranchId)
    } catch (caught) {
      handleApiError(caught, t('feedback.deleteError'))
    }
  }

  const start =
    inventory.totalItems === 0
      ? 0
      : (inventory.page - 1) * inventory.pageSize + 1
  const end = Math.min(
    inventory.page * inventory.pageSize,
    inventory.totalItems,
  )

  return (
    <div className='mx-auto w-full max-w-6xl space-y-6'>
      <header>
        <h1 className='type-page-title'>{t('title')}</h1>
        <p className='type-secondary mt-2'>{t('description')}</p>
      </header>

      {isAdmin && (
        <div className='flex flex-col items-start gap-2 sm:flex-row sm:items-center'>
          <label className='flex min-h-10 w-full items-center gap-2 rounded-lg border border-input bg-background px-3 sm:w-fit sm:min-w-72'>
            <span className='shrink-0 text-sm text-muted-foreground'>
              {t('filter.branch')}
            </span>
            <select
              value={selectedBranchId}
              onChange={event => {
                setSelectedBranchId(event.currentTarget.value)
                setPage(1)
              }}
              aria-label={t('filter.branch')}
              disabled={
                isBranchesLoading || branchesLoadFailed || branches.length === 0
              }
              className='min-w-0 flex-1 bg-transparent py-2 text-sm font-medium text-foreground outline-none'
            >
              <option value='' disabled>
                {branches.length === 0
                  ? t('filter.noBranchesAvailable')
                  : t('filter.selectBranch')}
              </option>
              {branches.map(branch => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </label>
          {branchesLoadFailed && (
            <Button
              type='button'
              variant='outline'
              onClick={() => void loadBranchOptions()}
            >
              {t('actions.retry')}
            </Button>
          )}
        </div>
      )}

      {feedback && (
        <p role='status' className='text-sm text-success'>
          {feedback}
        </p>
      )}
      {error && (
        <p role='alert' className='text-sm text-destructive'>
          {error}
        </p>
      )}
      {branchesError && (
        <p role='alert' className='text-sm text-destructive'>
          {branchesError}
        </p>
      )}
      {error && inventory.items.length > 0 && !isLoading && (
        <Button
          type='button'
          variant='outline'
          onClick={() => void loadInventory(page, pageSize, selectedBranchId)}
        >
          {t('actions.retry')}
        </Button>
      )}

      {isLoading ? (
        <p role='status' className='text-sm text-muted-foreground'>
          {t('feedback.loading')}
        </p>
      ) : error && inventory.items.length === 0 ? (
        <Button
          type='button'
          variant='outline'
          onClick={() => void loadInventory(page, pageSize, selectedBranchId)}
        >
          {t('actions.retry')}
        </Button>
      ) : (
        <Card className='gap-0 overflow-hidden p-0'>
          <div className='border-b border-border p-4 sm:p-5'>
            <p className='text-sm text-muted-foreground' aria-live='polite'>
              {t('resultsCount', { count: inventory.totalItems })}
            </p>
          </div>
          {isAdmin && branches.length === 0 ? (
            <p
              role='status'
              className='px-6 py-10 text-center text-sm text-muted-foreground'
            >
              {t('filter.noBranchesAvailable')}
            </p>
          ) : isAdmin && !selectedBranchId ? (
            <p
              role='status'
              className='px-6 py-10 text-center text-sm text-muted-foreground'
            >
              {t('filter.selectBranchPrompt')}
            </p>
          ) : inventory.items.length ? (
            <>
              <CardContent className='hidden p-0 sm:block'>
                <table className='w-full text-start text-sm'>
                  <thead className='bg-muted/40'>
                    <tr className='border-b border-border'>
                      <th className='px-5 py-3.5 text-start font-medium'>
                        {t('table.product')}
                      </th>
                      <th className='px-5 py-3.5 text-end font-medium'>
                        {t('table.quantity')}
                      </th>
                      <th className='px-5 py-3.5 text-end font-medium'>
                        {t('table.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-border'>
                    {inventory.items.map(record => (
                      <tr key={record._id} className='hover:bg-muted/30'>
                        <th className='px-5 py-4 text-start font-medium'>
                          {record.productId?.productName ??
                            t('details.notAvailable')}
                        </th>
                        <td
                          dir='ltr'
                          className='px-5 py-4 text-end tabular-nums'
                        >
                          {formatNumber(record.branchQuantity, locale)}
                        </td>
                        <td className='px-5 py-3'>
                          <RecordActions
                            record={record}
                            canManage={canManage}
                            onView={handleView}
                            onEdit={openEdit}
                            onDelete={setDeletingRecord}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
              <div className='grid gap-3 p-4 sm:hidden'>
                {inventory.items.map(record => (
                  <article
                    key={record._id}
                    className='rounded-lg border border-border p-4'
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <h2 className='break-words text-sm font-semibold'>
                        {record.productId?.productName ??
                          t('details.notAvailable')}
                      </h2>
                      <RecordActions
                        record={record}
                        canManage={canManage}
                        onView={handleView}
                        onEdit={openEdit}
                        onDelete={setDeletingRecord}
                      />
                    </div>
                    <p className='mt-3 text-sm text-muted-foreground'>
                      {t('table.quantity')}:{' '}
                      {formatNumber(record.branchQuantity, locale)}
                    </p>
                  </article>
                ))}
              </div>
              <footer className='flex flex-col gap-4 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex flex-wrap items-center gap-3 text-sm text-muted-foreground'>
                  <span>
                    {t('pagination.showing', {
                      start,
                      end,
                      total: inventory.totalItems,
                    })}
                  </span>
                  <label className='flex items-center gap-2'>
                    <span>{t('pagination.pageSize')}</span>
                    <select
                      value={inventory.pageSize}
                      onChange={event => {
                        const nextSize = pageSizes.find(
                          size => size === Number(event.currentTarget.value),
                        )
                        if (nextSize !== undefined) {
                          setPageSize(nextSize)
                          setPage(1)
                        }
                      }}
                      aria-label={t('pagination.pageSize')}
                      className='h-8 rounded-md border border-input bg-background px-2'
                    >
                      {pageSizes.map(size => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className='flex items-center justify-between gap-3 sm:justify-end'>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    disabled={inventory.page <= 1}
                    onClick={() => setPage(inventory.page - 1)}
                  >
                    {t('pagination.previous')}
                  </Button>
                  <span className='min-w-24 text-center text-sm text-muted-foreground'>
                    {t('pagination.page', {
                      page: inventory.page,
                      total: Math.max(1, inventory.totalPages),
                    })}
                  </span>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    disabled={inventory.page >= inventory.totalPages}
                    onClick={() => setPage(inventory.page + 1)}
                  >
                    {t('pagination.next')}
                  </Button>
                </div>
              </footer>
            </>
          ) : (
            <div className='flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center'>
              <h2 className='text-base font-semibold'>{t('empty.title')}</h2>
              <p className='mt-1 max-w-md text-sm text-muted-foreground'>
                {t('empty.description')}
              </p>
            </div>
          )}
        </Card>
      )}

      <BranchInventoryDetailsSheet
        record={viewingRecord}
        canManage={canManage}
        locale={locale}
        onClose={() => setViewingRecord(null)}
        onEdit={openEdit}
        onDelete={setDeletingRecord}
      />
      <Sheet
        open={editingRecord !== null}
        onOpenChange={open => {
          if (!open) setEditingRecord(null)
        }}
      >
        <SheetContent
          side={locale === 'ar' ? 'left' : 'right'}
          className='w-full sm:max-w-md'
        >
          <SheetHeader>
            <SheetTitle>{t('form.title')}</SheetTitle>
            <SheetDescription>
              {editingRecord?.productId?.productName ??
                t('details.notAvailable')}
            </SheetDescription>
          </SheetHeader>
          <div className='space-y-2 px-4'>
            <label
              htmlFor='branch-inventory-quantity'
              className='text-sm font-medium'
            >
              {t('table.quantity')}
            </label>
            <Input
              id='branch-inventory-quantity'
              type='number'
              min='0'
              step='1'
              inputMode='numeric'
              value={quantity}
              onChange={event => {
                setQuantity(event.currentTarget.value)
                setFormError('')
              }}
              aria-invalid={Boolean(formError)}
            />
            {formError && (
              <p role='alert' className='text-sm text-destructive'>
                {formError}
              </p>
            )}
          </div>
          <SheetFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setEditingRecord(null)}
            >
              {t('actions.cancel')}
            </Button>
            <Button type='button' onClick={() => void saveQuantity()}>
              {t('actions.save')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <Sheet
        open={deletingRecord !== null}
        onOpenChange={open => {
          if (!open) setDeletingRecord(null)
        }}
      >
        <SheetContent
          side={locale === 'ar' ? 'left' : 'right'}
          className='w-full sm:max-w-md'
        >
          <SheetHeader>
            <SheetTitle>{t('delete.title')}</SheetTitle>
            <SheetDescription>
              {t('delete.description', {
                name:
                  deletingRecord?.productId?.productName ??
                  t('details.notAvailable'),
              })}
            </SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setDeletingRecord(null)}
            >
              {t('actions.cancel')}
            </Button>
            <Button
              type='button'
              variant='destructive'
              onClick={() => void confirmDelete()}
            >
              {t('actions.delete')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      {isDetailLoading && (
        <p role='status' className='text-sm text-muted-foreground'>
          {t('feedback.loadingDetails')}
        </p>
      )}
      {isBranchesLoading && (
        <p role='status' className='text-sm text-muted-foreground'>
          {branchT('states.loading')}
        </p>
      )}
    </div>
  )
}

function RecordActions({
  record,
  canManage,
  onView,
  onEdit,
  onDelete,
}: {
  record: BranchInventoryRecord
  canManage: boolean
  onView: (record: BranchInventoryRecord) => void
  onEdit: (record: BranchInventoryRecord) => void
  onDelete: (record: BranchInventoryRecord) => void
}) {
  const t = useTranslations('branchInventory')
  const productName = record.productId?.productName ?? t('details.notAvailable')

  return (
    <div className='flex shrink-0 justify-end gap-1'>
      <Button
        type='button'
        variant='ghost'
        size='icon'
        aria-label={t('actions.viewNamed', { name: productName })}
        onClick={() => onView(record)}
      >
        <Eye aria-hidden='true' />
      </Button>
      {canManage && (
        <>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            aria-label={t('actions.editNamed', { name: productName })}
            onClick={() => onEdit(record)}
          >
            <Pencil aria-hidden='true' />
          </Button>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            aria-label={t('actions.deleteNamed', { name: productName })}
            className='text-destructive hover:bg-destructive/10 hover:text-destructive'
            onClick={() => onDelete(record)}
          >
            <Trash2 aria-hidden='true' />
          </Button>
        </>
      )}
    </div>
  )
}

function BranchInventoryDetailsSheet({
  record,
  canManage,
  locale,
  onClose,
  onEdit,
  onDelete,
}: {
  record: BranchInventoryRecord | null
  canManage: boolean
  locale: 'en' | 'ar'
  onClose: () => void
  onEdit: (record: BranchInventoryRecord) => void
  onDelete: (record: BranchInventoryRecord) => void
}) {
  const t = useTranslations('branchInventory')

  return (
    <Sheet
      open={record !== null}
      onOpenChange={open => {
        if (!open) onClose()
      }}
    >
      <SheetContent
        side={locale === 'ar' ? 'left' : 'right'}
        className='w-full gap-0 overflow-y-auto p-0 sm:max-w-lg'
      >
        {record && (
          <>
            <SheetHeader className='relative border-b border-border p-6 pe-14'>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                aria-label={t('actions.close')}
                onClick={onClose}
                className='absolute end-3 top-3'
              >
                <X aria-hidden='true' />
              </Button>
              <SheetTitle>
                {record.productId?.productName ?? t('details.notAvailable')}
              </SheetTitle>
              <SheetDescription>{t('details.description')}</SheetDescription>
            </SheetHeader>
            <dl className='grid gap-5 p-6'>
              <Detail
                label={t('table.product')}
                value={
                  record.productId?.productName ?? t('details.notAvailable')
                }
              />
              <Detail
                label={t('details.productType')}
                value={
                  record.productId?.productType?.name ??
                  t('details.notAvailable')
                }
              />
              <Detail
                label={t('table.quantity')}
                value={formatNumber(record.branchQuantity, locale)}
              />
            </dl>
            {canManage && (
              <SheetFooter className='mt-auto flex-row justify-end border-t border-border p-6'>
                <Button
                  type='button'
                  variant='destructive'
                  onClick={() => onDelete(record)}
                >
                  <Trash2 aria-hidden='true' />
                  {t('actions.delete')}
                </Button>
                <Button type='button' onClick={() => onEdit(record)}>
                  <Pencil aria-hidden='true' />
                  {t('actions.edit')}
                </Button>
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className='space-y-1'>
      <dt className='text-sm font-medium text-muted-foreground'>{label}</dt>
      <dd className='break-words text-sm'>{value}</dd>
    </div>
  )
}
