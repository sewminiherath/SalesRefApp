"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText, Search, CheckCircle2, Loader2, Eye } from "lucide-react"
import { BackButton } from "@/components/ui/back-button"
import { clientsApi, type Client } from "@/lib/api/clients"
import { itemsApi, type StockItem } from "@/lib/api/items"
import { quotationsApi, type Quotation } from "@/lib/api/quotations"
import { toast } from "sonner"

interface QuotationItem {
  itemId: string
  itemName: string
  quantity: number
  unitPrice: number
  total: number
}

export default function QuotationsPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<"create" | "list">("create")
  
  const [selectedClient, setSelectedClient] = useState("")
  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([])
  const [discountPercent, setDiscountPercent] = useState("0")
  const [taxRate, setTaxRate] = useState("9")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  
  const [clients, setClients] = useState<Client[]>([])
  const [items, setItems] = useState<StockItem[]>([])
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [clientSearch, setClientSearch] = useState("")
  const [itemSearch, setItemSearch] = useState("")
  const [currentItem, setCurrentItem] = useState("")
  const [currentQuantity, setCurrentQuantity] = useState("1")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (isAuthenticated) {
      loadData()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (clientSearch) {
      const timer = setTimeout(() => {
        clientsApi.getAll(clientSearch).then(setClients)
      }, 300)
      return () => clearTimeout(timer)
    } else {
      clientsApi.getAll().then(setClients)
    }
  }, [clientSearch])

  useEffect(() => {
    if (itemSearch) {
      const timer = setTimeout(() => {
        itemsApi.getAll(itemSearch).then(setItems)
      }, 300)
      return () => clearTimeout(timer)
    } else {
      itemsApi.getAll().then(setItems)
    }
  }, [itemSearch])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [clientsData, itemsData, quotationsData] = await Promise.all([
        clientsApi.getAll(),
        itemsApi.getAll(),
        quotationsApi.getAll(),
      ])
      setClients(clientsData)
      setItems(itemsData)
      setQuotations(quotationsData)
    } catch (error: any) {
      toast.error("Failed to load data: " + (error.message || "Unknown error"))
    } finally {
      setIsLoading(false)
    }
  }

  const addItem = () => {
    const item = items.find((i) => i.id === currentItem)
    if (item && Number.parseInt(currentQuantity) > 0) {
      const quantity = Number.parseInt(currentQuantity)
      const total = item.unit_price * quantity

      setQuotationItems([
        ...quotationItems,
        {
          itemId: item.id,
          itemName: item.item_name,
          quantity,
          unitPrice: item.unit_price,
          total,
        },
      ])
      setCurrentItem("")
      setCurrentQuantity("1")
      toast.success("Item added")
    }
  }

  const removeItem = (index: number) => {
    setQuotationItems(quotationItems.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedClient) {
      toast.error("Please select a client")
      return
    }

    if (quotationItems.length === 0) {
      toast.error("Please add at least one item")
      return
    }

    try {
      setIsSubmitting(true)
      const subtotal = quotationItems.reduce((sum, item) => sum + item.total, 0)
      const discountAmount = (subtotal * (Number.parseFloat(discountPercent) || 0)) / 100
      const taxAmount = ((subtotal - discountAmount) * (Number.parseFloat(taxRate) || 0)) / 100

      const quotation = await quotationsApi.create({
        client_id: selectedClient,
        items: quotationItems.map((item) => ({
          item_id: item.itemId,
          quantity: item.quantity,
        })),
        discount: discountAmount,
        tax: taxAmount,
        date: selectedDate,
      })

      toast.success(`Quotation ${quotation.quotation_number} created successfully!`)
      
      setSelectedClient("")
      setQuotationItems([])
      setDiscountPercent("0")
      setTaxRate("9")
      setSelectedDate(new Date().toISOString().split("T")[0])
      setCurrentItem("")
      setCurrentQuantity("1")
      loadData()
    } catch (error: any) {
      toast.error("Failed to create quotation: " + (error.message || "Unknown error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConvertToInvoice = async (quotationId: string) => {
    try {
      const invoice = await quotationsApi.convertToInvoice(quotationId)
      toast.success(`Quotation converted to invoice ${invoice.invoice_number}!`)
      router.push("/invoices")
    } catch (error: any) {
      toast.error("Failed to convert quotation: " + (error.message || "Unknown error"))
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const subtotal = quotationItems.reduce((sum, item) => sum + item.total, 0)
  const discountAmount = (subtotal * (Number.parseFloat(discountPercent) || 0)) / 100
  const taxAmount = ((subtotal - discountAmount) * (Number.parseFloat(taxRate) || 0)) / 100
  const grandTotal = subtotal - discountAmount + taxAmount

  const selectedClientData = clients.find((c) => c.id === selectedClient)

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton />
            <h1 className="text-2xl font-bold">Quotations</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant={activeTab === "create" ? "default" : "outline"}
              onClick={() => setActiveTab("create")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create
            </Button>
            <Button
              variant={activeTab === "list" ? "default" : "outline"}
              onClick={() => setActiveTab("list")}
            >
              <FileText className="h-4 w-4 mr-2" />
              List
            </Button>
          </div>
        </div>

        {activeTab === "create" ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client-search">Search Client</Label>
                  <Input
                    id="client-search"
                    placeholder="Search clients..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="text-lg h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Select Client *</Label>
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger className="text-lg h-12">
                      <SelectValue placeholder="Choose a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} ({client.client_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Quotation Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="text-lg h-12"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Add Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="item-search">Search Items</Label>
                  <Input
                    id="item-search"
                    placeholder="Search items..."
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    className="text-lg h-12"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={currentItem} onValueChange={setCurrentItem}>
                    <SelectTrigger className="flex-1 text-lg h-12">
                      <SelectValue placeholder="Select item" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.item_name} - Rs. {item.unit_price.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="1"
                    value={currentQuantity}
                    onChange={(e) => setCurrentQuantity(e.target.value)}
                    placeholder="Qty"
                    className="w-24 text-lg h-12"
                  />
                  <Button type="button" onClick={addItem} disabled={!currentItem} className="h-12 px-6">
                    <Plus className="h-5 w-5 mr-2" />
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>

            {quotationItems.length > 0 && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Quotation Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {quotationItems.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{item.itemName}</p>
                            <p className="text-sm text-muted-foreground">
                              Rs. {item.unitPrice.toFixed(2)} × {item.quantity} = Rs. {item.total.toFixed(2)}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                            className="h-10 w-10"
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quotation Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="discount">Discount (%)</Label>
                        <Input
                          id="discount"
                          type="number"
                          min="0"
                          max="100"
                          value={discountPercent}
                          onChange={(e) => setDiscountPercent(e.target.value)}
                          className="text-lg h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tax">Tax Rate (%)</Label>
                        <Input
                          id="tax"
                          type="number"
                          value={taxRate}
                          onChange={(e) => setTaxRate(e.target.value)}
                          className="text-lg h-12"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 bg-muted p-4 rounded-lg">
                      <div className="flex justify-between text-lg">
                        <span>Subtotal:</span>
                        <span className="font-medium">Rs. {subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-lg">
                        <span>Discount:</span>
                        <span className="text-destructive">-Rs. {discountAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-lg">
                        <span>Tax:</span>
                        <span className="font-medium">Rs. {taxAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-2xl font-bold border-t pt-2 mt-2">
                        <span>Total:</span>
                        <span>Rs. {grandTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      disabled={!selectedClient || quotationItems.length === 0 || isSubmitting}
                      className="w-full h-14 text-lg"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-5 w-5" />
                          Create Quotation
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </form>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>All Quotations</CardTitle>
            </CardHeader>
            <CardContent>
              {quotations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No quotations found</p>
              ) : (
                <div className="space-y-2">
                  {quotations.map((quotation) => (
                    <div
                      key={quotation.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-semibold">{quotation.quotation_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {quotation.client_name} • {new Date(quotation.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>{quotation.status}</Badge>
                        <p className="font-semibold">Rs. {quotation.total.toFixed(2)}</p>
                        {quotation.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => handleConvertToInvoice(quotation.id)}
                          >
                            Convert to Invoice
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}


