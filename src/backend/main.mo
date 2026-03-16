import Array "mo:core/Array";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Set "mo:core/Set";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import List "mo:core/List";
import Float "mo:core/Float";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  ////////////////////
  // Type Definitions
  ////////////////////

  type CustomerId = Nat;
  type VegetableId = Nat;
  type OrderId = Nat;

  type Vegetable = {
    id : VegetableId;
    name : Text;
    unit : Text;
    pricePerUnit : Float;
    stock : Float;
    imageUrl : ?Text;
  };

  module Vegetable {
    public func compare(vegetable1 : Vegetable, vegetable2 : Vegetable) : Order.Order {
      Int.compare(vegetable1.id, vegetable2.id);
    };
  };

  type Customer = {
    id : CustomerId;
    name : Text;
    phone : Text;
    password : Text;
    principal : Principal;
  };

  type OrderItem = {
    vegetableId : VegetableId;
    quantity : Float;
  };

  type OrderStatus = {
    #pending;
    #inDelivery;
    #delivered;
    #cancelled;
  };

  type Order = {
    id : OrderId;
    customerId : CustomerId;
    items : [OrderItem];
    address : Text;
    totalAmount : Float;
    timestamp : Time.Time;
    status : OrderStatus;
  };

  type DailySales = {
    date : Int; // Unix timestamp for the day
    totalSales : Float;
  };

  type AccountingSummary = {
    totalRevenue : Float;
    totalOrders : Nat;
    pendingOrders : Nat;
    inDeliveryOrders : Nat;
    deliveredOrders : Nat;
    cancelledOrders : Nat;
    dailyBreakdown : [DailySales];
  };

  module Customer {
    public func compare(customer1 : Customer, customer2 : Customer) : Order.Order {
      Int.compare(customer1.id, customer2.id);
    };
  };

  public type UserProfile = {
    name : Text;
    phone : Text;
  };

  ///////////
  // Storage
  ///////////

  var nextVegetableId = 1;
  var nextCustomerId = 1;
  var nextOrderId = 1;

  let vegetables = Map.empty<VegetableId, Vegetable>();
  let customers = Map.empty<CustomerId, Customer>();
  let orders = Map.empty<OrderId, Order>();

  let phoneToCustomerId = Map.empty<Text, CustomerId>();
  let principalToCustomerId = Map.empty<Principal, CustomerId>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Access control state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  //////
  // User Profile Functions (Required by Frontend)
  //////

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  //////
  // Admin Functions
  //////

  public shared ({ caller }) func addVegetable(name : Text, unit : Text, pricePerUnit : Float, stock : Float, imageUrl : ?Text) : async VegetableId {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admin can add vegetables");
    };

    let id = nextVegetableId;
    let vegetable : Vegetable = {
      id;
      name;
      unit;
      pricePerUnit;
      stock;
      imageUrl;
    };

    vegetables.add(id, vegetable);
    nextVegetableId += 1;
    id;
  };

  public shared ({ caller }) func updateVegetable(id : VegetableId, name : Text, unit : Text, pricePerUnit : Float, stock : Float, imageUrl : ?Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admin can update vegetables");
    };

    switch (vegetables.get(id)) {
      case (null) { Runtime.trap("Vegetable not found") };
      case (?_) {
        let updatedVegetable : Vegetable = {
          id;
          name;
          unit;
          pricePerUnit;
          stock;
          imageUrl;
        };
        vegetables.add(id, updatedVegetable);
      };
    };
  };

  public shared ({ caller }) func removeVegetable(id : VegetableId) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admin can remove vegetables");
    };
    if (not vegetables.containsKey(id)) { Runtime.trap("Vegetable does not exist") };
    vegetables.remove(id);
  };

  public shared ({ caller }) func updateOrderStatus(orderId : OrderId, status : OrderStatus) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admin can update order status");
    };

    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        let updatedOrder : Order = {
          id = order.id;
          customerId = order.customerId;
          items = order.items;
          address = order.address;
          totalAmount = order.totalAmount;
          timestamp = order.timestamp;
          status;
        };
        orders.add(orderId, updatedOrder);
      };
    };
  };

  public query ({ caller }) func getAllOrders() : async [Order] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admin can view all orders");
    };
    orders.toArray().map(func((_, order)) { order });
  };

  public query ({ caller }) func getAllCustomers() : async [UserProfile] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admin can view all customers");
    };
    customers.values().toArray().map(func(customer) { { name = customer.name; phone = customer.phone } });
  };

  ////////////
  // Customer Functions
  ////////////

  public shared ({ caller }) func registerCustomer(name : Text, phone : Text, password : Text) : async CustomerId {
    if (phoneToCustomerId.containsKey(phone)) {
      Runtime.trap("Phone number already registered");
    };

    if (principalToCustomerId.containsKey(caller)) {
      Runtime.trap("Principal already registered");
    };

    let id = nextCustomerId;
    let customer : Customer = {
      id;
      name;
      phone;
      password;
      principal = caller;
    };

    customers.add(id, customer);
    phoneToCustomerId.add(phone, id);
    principalToCustomerId.add(caller, id);
    
    // Also save to user profile for frontend compatibility
    userProfiles.add(caller, { name; phone });
    
    nextCustomerId += 1;
    id;
  };

  public shared ({ caller }) func loginCustomer(phone : Text, password : Text) : async CustomerId {
    switch (phoneToCustomerId.get(phone)) {
      case (null) { Runtime.trap("Phone number not found") };
      case (?customerId) {
        switch (customers.get(customerId)) {
          case (null) { Runtime.trap("Customer not found") };
          case (?customer) {
            if (customer.password != password) {
              Runtime.trap("Invalid password");
            };
            
            // Update principal mapping if caller is different
            if (customer.principal != caller) {
              principalToCustomerId.remove(customer.principal);
              principalToCustomerId.add(caller, customerId);
              
              let updatedCustomer : Customer = {
                id = customer.id;
                name = customer.name;
                phone = customer.phone;
                password = customer.password;
                principal = caller;
              };
              customers.add(customerId, updatedCustomer);
              
              // Update user profile
              userProfiles.add(caller, { name = customer.name; phone = customer.phone });
            };
            
            customerId;
          };
        };
      };
    };
  };

  public query ({ caller }) func getCustomerProfile(customerId : CustomerId) : async UserProfile {
    switch (customers.get(customerId)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?customer) {
        // Authorization: Only the customer themselves or admin can view
        let callerCustomerId = principalToCustomerId.get(caller);
        let isOwnProfile = switch (callerCustomerId) {
          case (?cid) { cid == customerId };
          case (null) { false };
        };
        
        if (not isOwnProfile and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own profile");
        };
        
        { name = customer.name; phone = customer.phone };
      };
    };
  };

  //////
  // Vegetable Catalog Functions
  //////

  public query ({ caller }) func getVegetables() : async [Vegetable] {
    vegetables.values().toArray().sort();
  };

  public query ({ caller }) func getVegetable(id : VegetableId) : async Vegetable {
    switch (vegetables.get(id)) {
      case (null) { Runtime.trap("Vegetable not found") };
      case (?vegetable) { vegetable };
    };
  };

  //////
  // Order Functions
  //////

  // Order calculation function
  func calculateTotal(items : [OrderItem]) : Float {
    var total : Float = 0;
    for (item in items.values()) {
      switch (vegetables.get(item.vegetableId)) {
        case (null) { Runtime.trap("Vegetable not found in order") };
        case (?vegetable) { total += vegetable.pricePerUnit * item.quantity };
      };
    };
    total;
  };

  func checkStock(items : [OrderItem]) {
    for (item in items.values()) {
      switch (vegetables.get(item.vegetableId)) {
        case (null) { Runtime.trap("Vegetable not found") };
        case (?vegetable) {
          if (item.quantity > vegetable.stock) {
            Runtime.trap("Not enough stock for " # vegetable.name);
          };
        };
      };
    };
  };

  func updateStock(items : [OrderItem]) {
    for (item in items.values()) {
      switch (vegetables.get(item.vegetableId)) {
        case (null) {};
        case (?vegetable) {
          let updatedVegetable : Vegetable = {
            id = vegetable.id;
            name = vegetable.name;
            unit = vegetable.unit;
            pricePerUnit = vegetable.pricePerUnit;
            stock = vegetable.stock - item.quantity;
            imageUrl = vegetable.imageUrl;
          };
          vegetables.add(vegetable.id, updatedVegetable);
        };
      };
    };
  };

  public shared ({ caller }) func placeOrder(customerId : CustomerId, items : [OrderItem], address : Text) : async OrderId {
    if (items.isEmpty()) { Runtime.trap("Order must contain at least one item") };

    // Authorization: Only the customer themselves can place orders for their account
    let callerCustomerId = principalToCustomerId.get(caller);
    let isOwnOrder = switch (callerCustomerId) {
      case (?cid) { cid == customerId };
      case (null) { false };
    };
    
    if (not isOwnOrder) {
      Runtime.trap("Unauthorized: Can only place orders for your own account");
    };

    // Verify customer exists
    switch (customers.get(customerId)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?_) {};
    };

    checkStock(items);

    let totalAmount = calculateTotal(items);
    let orderId = nextOrderId;
    let order : Order = {
      id = orderId;
      customerId;
      items;
      address;
      totalAmount;
      timestamp = Time.now();
      status = #pending;
    };

    orders.add(orderId, order);
    updateStock(items);
    nextOrderId += 1;
    orderId;
  };

  public query ({ caller }) func getOrder(orderId : OrderId) : async Order {
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        // Authorization: Only the customer who placed the order or admin can view it
        let callerCustomerId = principalToCustomerId.get(caller);
        let isOwnOrder = switch (callerCustomerId) {
          case (?cid) { cid == order.customerId };
          case (null) { false };
        };
        
        if (not isOwnOrder and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own orders");
        };
        
        order;
      };
    };
  };

  public query ({ caller }) func getCustomerOrders(customerId : CustomerId) : async [Order] {
    // Authorization: Only the customer themselves or admin can view their orders
    let callerCustomerId = principalToCustomerId.get(caller);
    let isOwnOrders = switch (callerCustomerId) {
      case (?cid) { cid == customerId };
      case (null) { false };
    };
    
    if (not isOwnOrders and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own orders");
    };

    orders.toArray().map(func(pair) { pair.1 }).filter(func(order) { order.customerId == customerId });
  };

  /////
  // Accounting Summary
  /////

  public query ({ caller }) func getAccountingSummary() : async AccountingSummary {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admin can access accounting summary");
    };

    var totalRevenue : Float = 0;
    var totalOrders = 0;
    var pendingOrders = 0;
    var inDeliveryOrders = 0;
    var deliveredOrders = 0;
    var cancelledOrders = 0;

    let dailyBreakdownMap = Map.empty<Int, Float>();

    for (order in orders.values()) {
      totalOrders += 1;
      switch (order.status) {
        case (#pending) { pendingOrders += 1 };
        case (#inDelivery) { inDeliveryOrders += 1 };
        case (#delivered) {
          deliveredOrders += 1;
          totalRevenue += order.totalAmount;

          let dayTimestamp = order.timestamp / (24 * 60 * 60 * 1000000);

          let dayTotal = switch (dailyBreakdownMap.get(dayTimestamp)) {
            case (null) { 0.0 };
            case (?amount) { amount };
          };
          dailyBreakdownMap.add(dayTimestamp, dayTotal + order.totalAmount);
        };
        case (#cancelled) { cancelledOrders += 1 };
      };
    };

    let dailyBreakdown = dailyBreakdownMap.toArray().sort(func((a, b)) { Int.compare(a.0, b.0) }).map(
      func((date, totalSales)) {
        { date; totalSales };
      }
    );

    {
      totalRevenue;
      totalOrders;
      pendingOrders;
      inDeliveryOrders;
      deliveredOrders;
      cancelledOrders;
      dailyBreakdown;
    };
  };
};
