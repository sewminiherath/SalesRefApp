"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Search, CheckCircle2 } from "lucide-react"
import { clientsApi, type Client } from "@/lib/api/clients"
import { itemsApi, type StockItem } from "@/lib/api/items"
import { invoicesApi } from "@/lib/api/invoices"
import { toast } from "sonner"

interface InvoiceItem {
  itemId: string
  itemName: string
  quantity: number
  unitPrice: number
  total: number
}

export function CreateInvoiceForm() {
  const [selectedClient, setSelectedClient] = useState("")
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([])
  const [discountPercent, setDiscountPercent] = useState("0")
  const [taxRate, setTaxRate] = useState("9")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "cheque" | "card" | "transfer" | "">("")
  const [cashAmount, setCashAmount] = useState("")
  const [chequeNumber, setChequeNumber] = useState("")
  const [chequeBank, setChequeBank] = useState("")
  const [chequeDate, setChequeDate] = useState("")
  const [chequeAmount, setChequeAmount] = useState("")
  
  const [clients, setClients] = useState<Client[]>([])
  const [items, setItems] = useState<StockItem[]>([])
  const [clientSearch, setClientSearch] = useState("")
  const [itemSearch, setItemSearch] = useState("")
  const [currentItem, setCurrentItem] = useState("")
  const [currentQuantity, setCurrentQuantity] = useState("1")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

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
      const [clientsData, itemsData] = await Promise.all([
        clientsApi.getAll(),
        itemsApi.getAll(),
      ])
      setClients(clientsData)
      setItems(itemsData)
    } catch (error: any) {
      toast.error("Failed to load data: " + (error.message || "Unknown error"))
    } finally {
      setIsLoading(false)
    }
  }

  const addItem = () => {
    const item = items.find((i) => i.id === currentItem)
    if (item && Number.parseInt(currentQuantity) > 0) {
      if (item.quantity < Number.parseInt(currentQuantity)) {
        toast.error(`Insufficient stock! Available: ${item.quantity}`)
        return
      }
      const quantity = Number.parseInt(currentQuantity)
      const total = item.unit_price * quantity

      setInvoiceItems([
        ...invoiceItems,
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
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index))
  }

  const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0)
  const discountAmount = (subtotal * (Number.parseFloat(discountPercent) || 0)) / 100
  const taxAmount = ((subtotal - discountAmount) * (Number.parseFloat(taxRate) || 0)) / 100
  const grandTotal = subtotal - discountAmount + taxAmount

  // Keep cash / cheque amounts in sync with total by default
  useEffect(() => {
    if (paymentMethod === "cash" && !cashAmount) {
      setCashAmount(grandTotal.toFixed(2))
    }
    if (paymentMethod === "cheque" && !chequeAmount) {
      setChequeAmount(grandTotal.toFixed(2))
    }
  }, [paymentMethod, grandTotal, cashAmount, chequeAmount])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedClient) {
      toast.error("Please select a client")
      return
    }

    if (invoiceItems.length === 0) {
      toast.error("Please add at least one item")
      return
    }

    if (!paymentMethod) {
      toast.error("Please select a payment method")
      return
    }

    if (paymentMethod === "cash") {
      const cash = Number.parseFloat(cashAmount || "0")
      if (!cash || cash <= 0) {
        toast.error("Please enter the cash amount received")
        return
      }
    }

    if (paymentMethod === "cheque") {
      if (!chequeNumber || !chequeBank || !chequeDate) {
        toast.error("Please fill cheque number, bank, and date")
        return
      }
    }

    try {
      setIsSubmitting(true)
      const cash = Number.parseFloat(cashAmount || "0")
      const chequeAmt = Number.parseFloat(chequeAmount || grandTotal.toString())

      const invoice = await invoicesApi.create({
        client_id: selectedClient,
        items: invoiceItems.map((item) => ({
          item_id: item.itemId,
          quantity: item.quantity,
        })),
        discount: discountAmount,
        tax: taxAmount,
        status:
          paymentMethod === "cash" && cash >= grandTotal
            ? "paid"
            : "pending",
        date: selectedDate,
        payment_method: paymentMethod,
        cash_amount: paymentMethod === "cash" ? cash : undefined,
        cash_change: paymentMethod === "cash" ? Math.max(cash - grandTotal, 0) : undefined,
        cheque_number: paymentMethod === "cheque" ? chequeNumber : undefined,
        cheque_bank: paymentMethod === "cheque" ? chequeBank : undefined,
        cheque_date: paymentMethod === "cheque" ? chequeDate : undefined,
        cheque_amount: paymentMethod === "cheque" ? chequeAmt : undefined,
      })

      toast.success(`Invoice ${invoice.invoice_number} created successfully!`)
      
      // Reset form
      setSelectedClient("")
      setInvoiceItems([])
      setDiscountPercent("0")
      setTaxRate("9")
      setSelectedDate(new Date().toISOString().split("T")[0])
      setPaymentMethod("")
      setCashAmount("")
      setChequeAmount("")
      setChequeNumber("")
      setChequeBank("")
      setChequeDate("")
      setCurrentItem("")
      setCurrentQuantity("1")
    } catch (error: any) {
      toast.error("Failed to create invoice: " + (error.message || "Unknown error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedClientData = clients.find((c) => c.id === selectedClient)

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-4xl mx-auto">
      {/* Client Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select Client *</Label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="text-lg h-12">
                <SelectValue placeholder="Search and select a client" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search clients..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="pl-8 h-9"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                {clients
                  .filter((client) => {
                    if (!clientSearch) return true
                    const search = clientSearch.toLowerCase()
                    return (
                      client.name.toLowerCase().includes(search) ||
                      client.client_id.toLowerCase().includes(search) ||
                      (client.email && client.email.toLowerCase().includes(search))
                    )
                  })
                  .map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} ({client.client_id})
                    </SelectItem>
                  ))}
                {clients.filter((client) => {
                  if (!clientSearch) return false
                  const search = clientSearch.toLowerCase()
                  return (
                    client.name.toLowerCase().includes(search) ||
                    client.client_id.toLowerCase().includes(search) ||
                    (client.email && client.email.toLowerCase().includes(search))
                  )
                }).length === 0 && clientSearch && (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    No clients found
                  </div>
                )}
              </SelectContent>
            </Select>
            {selectedClientData && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p><strong>Email:</strong> {selectedClientData.email || "N/A"}</p>
                <p><strong>Phone:</strong> {selectedClientData.phone || "N/A"}</p>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Invoice Date</Label>
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

      {/* Item Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Add Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Label>Select Item</Label>
              <Select value={currentItem} onValueChange={setCurrentItem}>
                <SelectTrigger className="text-lg h-12">
                  <SelectValue placeholder="Search and select an item" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2 border-b sticky top-0 bg-background z-10">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search items..."
                        value={itemSearch}
                        onChange={(e) => setItemSearch(e.target.value)}
                        className="pl-8 h-9"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  {items
                    .filter((item) => {
                      if (!itemSearch) return true
                      const search = itemSearch.toLowerCase()
                      return (
                        item.item_name.toLowerCase().includes(search) ||
                        item.item_code.toLowerCase().includes(search) ||
                        item.category.toLowerCase().includes(search)
                      )
                    })
                    .map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.item_name} - Rs. {item.unit_price.toFixed(2)} (Stock: {item.quantity})
                      </SelectItem>
                    ))}
                  {items.filter((item) => {
                    if (!itemSearch) return false
                    const search = itemSearch.toLowerCase()
                    return (
                      item.item_name.toLowerCase().includes(search) ||
                      item.item_code.toLowerCase().includes(search) ||
                      item.category.toLowerCase().includes(search)
                    )
                  }).length === 0 && itemSearch && (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No items found
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="w-24 space-y-2">
              <Label>Qty</Label>
              <Input
                type="number"
                min="1"
                value={currentQuantity}
                onChange={(e) => setCurrentQuantity(e.target.value)}
                placeholder="Qty"
                className="text-lg h-12"
              />
            </div>
            <div className="flex items-end">
              <Button type="button" onClick={addItem} disabled={!currentItem} className="h-12 px-6">
                <Plus className="h-5 w-5 mr-2" />
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items List */}
      {invoiceItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Invoice Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invoiceItems.map((item, index) => (
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
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {invoiceItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Invoice Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="discount">Discount (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  placeholder="0"
                  className="text-lg h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax">Tax Rate (%)</Label>
                <Input
                  id="tax"
                  type="number"
                  step="0.01"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  placeholder="0"
                  className="text-lg h-12"
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Method *</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="text-lg h-12">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {paymentMethod === "cash" && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cashAmount">Cash Amount (Rs.)</Label>
                  <Input
                    id="cashAmount"
                    type="number"
                    min="0"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    className="text-lg h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Change (Rs.)</Label>
                  <div className="h-12 flex items-center rounded-md border bg-muted px-3 text-lg">
                    Rs. {Math.max(Number.parseFloat(cashAmount || "0") - grandTotal, 0).toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === "cheque" && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="chequeNumber">Cheque Number</Label>
                  <Input
                    id="chequeNumber"
                    value={chequeNumber}
                    onChange={(e) => setChequeNumber(e.target.value)}
                    className="text-lg h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chequeBank">Bank</Label>
                  <Input
                    id="chequeBank"
                    value={chequeBank}
                    onChange={(e) => setChequeBank(e.target.value)}
                    className="text-lg h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chequeDate">Cheque Date</Label>
                  <Input
                    id="chequeDate"
                    type="date"
                    value={chequeDate}
                    onChange={(e) => setChequeDate(e.target.value)}
                    className="text-lg h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chequeAmount">Cheque Amount (Rs.)</Label>
                  <Input
                    id="chequeAmount"
                    type="number"
                    min="0"
                    value={chequeAmount}
                    onChange={(e) => setChequeAmount(e.target.value)}
                    className="text-lg h-12"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2 bg-muted p-4 rounded-lg">
              <div className="flex justify-between text-lg">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">Rs. {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="text-muted-foreground">
                  Discount ({discountPercent}%):
                </span>
                <span className="font-medium text-destructive">-Rs. {discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="text-muted-foreground">Tax ({taxRate}%):</span>
                <span className="font-medium">Rs. {taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-2xl font-bold border-t pt-2 mt-2">
                <span>Grand Total:</span>
                <span>Rs. {grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={!selectedClient || invoiceItems.length === 0 || !paymentMethod || isSubmitting}
              className="w-full h-14 text-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Invoice...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Create Invoice
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </form>
  )
}

