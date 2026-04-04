---
title: Spring框架依赖注入深度解析：从XML到注解的演进之路
date: 2025-05-28 22:37
updated: 2025-12-01 15:30
tags: [Spring,Java,依赖注入,IoC,框架设计]
categories: [Java技术栈]
description: 深入理解Spring框架的核心概念——依赖注入，探索从XML配置到注解配置的演进历程，掌握现代Spring开发的最佳实践。
cover: https://cdn.jsdelivr.net/gh/spring-projects/spring-framework@main/src/docs/asciidoc/images/spring-overview.png
series: Java / 后端成长线
difficulty: beginner
keywords: [Spring, IoC, 依赖注入]
hero_desc: 从 Spring 的 IoC 和依赖注入切入，为后续并发和架构文章打基础。
recommended_next:
  - Java并发编程深度解析：从理论到实践
---

# Spring框架依赖注入深度解析：从XML到注解的演进之路

> 🌟 **核心要点预览**
> - 理解IoC容器的本质和作用
> - 掌握依赖注入的三种实现方式
> - 对比XML配置与注解配置的优劣
> - 学习Spring Boot的自动配置原理
> - 探索现代Spring开发最佳实践

## 🎯 什么是依赖注入？为什么需要它？

在讨论注解，xml之前，我们先回归spring最核心，也是最重要的概念——容器。容器，顾名思义，为某种特定组件的运行提供必要支持的一个软件环境。在java开发中，组件的耦合依赖是常有之事。举个例子，参考廖雪峰老师的教程（知乎号：[(廖雪峰 - 知乎](https://www.zhihu.com/people/liaoxuefeng)）

我们假定一个在线书店，通过`BookService`获取书籍：

```java
public class BookService {
    private HikariConfig config = new HikariConfig();
    private DataSource dataSource = new HikariDataSource(config);

    public Book getBook(long bookId) {
        try (Connection conn = dataSource.getConnection()) {
            ...
            return book;
        }
    }
}
```

为了实例化一个HikariDataSource，我们不得不实例化一个HikariConfig。而要实例化这个HikariConfig，我们必须要熟知它的配置

现在，我们继续编写`UserService`获取用户：

```java
public class UserService {
    private HikariConfig config = new HikariConfig();
    private DataSource dataSource = new HikariDataSource(config);

    public User getUser(long userId) {
        try (Connection conn = dataSource.getConnection()) {
            ...
            return user;
        }
    }
}
```



因为`UserService`也需要访问数据库，因此，我们不得不也实例化一个`HikariDataSource`。

在处理用户购买的`CartServlet`中，我们需要实例化`UserService`和`BookService`：

```java
public class CartServlet extends HttpServlet {
    private BookService bookService = new BookService();
    private UserService userService = new UserService();

    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        long currentUserId = getFromCookie(req);
        User currentUser = userService.getUser(currentUserId);
        Book book = bookService.getBook(req.getParameter("bookId"));
        cartService.addToCart(currentUser, book);
        ...
    }
}
```

通过上述代码我们可以看出无论是BookService还是UserService，都通过new一个实例来创建HikariCofig，这显然造成了冗余和资源的浪费，他们明明可以共享一个HikariConfig,更准确的说是由这个配置创建的datasource。但谁来负责创建这个组件，谁又来负责管理和销毁这个组件，以处理它所带来的一系列的依赖和耦合呢，如果该组件被多个组件共享，如何确保它的使用方都已经全部被销毁？测试某个组件，例如`BookService`，是复杂的，因为必须要在真实的数据库环境下执行。这一系列问题，都导致了这个容器出现的必然。而在spring框架中，这个容器被命名为**IOC**，直译为控制反转。

# IOC的原理

传统的应用程序中，控制权在程序本身，程序的控制流程完全由开发者控制，例如：

`CartServlet`创建了`BookService`，在创建`BookService`的过程中，又创建了`DataSource`组件。这种模式的缺点是，一个组件如果要使用另一个组件，必须先知道如何正确地创建它。

在IoC模式下，控制权发生了反转，即从应用程序转移到了IoC容器，所有组件不再由应用程序自己创建和配置，而是由IoC容器负责，这样，应用程序只需要直接使用已经创建好并且配置好的组件。为了能让组件在IoC容器中被“装配”出来，需要某种“注入”机制，例如，`BookService`自己并不会创建`DataSource`，而是等待外部通过`setDataSource()`方法来注入一个`DataSource`：

```java
public class BookService {
    private DataSource dataSource;

    public void setDataSource(DataSource dataSource) {
        this.dataSource = dataSource;
    }
}
```



不直接`new`一个`DataSource`，而是注入一个`DataSource`，这个小小的改动虽然简单，却带来了一系列好处：

1. `BookService`不再关心如何创建`DataSource`，因此，不必编写读取数据库配置之类的代码；
2. `DataSource`实例被注入到`BookService`，同样也可以注入到`UserService`，因此，共享一个组件非常简单；
3. 测试`BookService`更容易，因为注入的是`DataSource`，可以使用内存数据库，而不是真实的MySQL配置。

因此，IoC又称为**依赖注入**（DI：Dependency Injection），它解决了一个最主要的问题：将组件的创建+配置与组件的使用相分离，并且，由IoC容器负责管理组件的生命周期。

<u>在ioc里容器里，所有的组件都被叫做Javabean,即配置一个组件就是配置一个Bean。</u>这句话让我受益匪浅。



## Xml配置

在spring框架里，有自带的application.xml文件。在里面，你可以自己管理所有的bean。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.springframework.org/schema/beans
        https://www.springframework.org/schema/beans/spring-beans.xsd">

    <bean id="userService" class="com.itranswarp.learnjava.service.UserService">
        <property name="mailService" ref="mailService" />
    </bean>

    <bean id="mailService" class="com.itranswarp.learnjava.service.MailService" />
</beans>
```

bean对象通过<bean>管理和标识，<property name=""  ref="">来注入别的bean对象

## 注解配置

像上面的xml配置，缺点弊端一目了然，一想便知，每构造一个bean对象，我们就要在xml里配置注入ioc容器，组件和组件之间的依赖写起来也十分麻烦，容易遗忘，不便于维护。

**于是**

spring引出了注解。

```java
@Component
public class MailService {
    ...
}
```



这个`@Component`注解就相当于定义了一个Bean，它有一个可选的名称，默认是`mailService`，即小写开头的类名。

然后，我们给`UserService`添加一个`@Component`注解和一个`@Autowired`注解：

```java
@Component
public class UserService {
    @Autowired
    MailService mailService;

    ...
}
```



使用`@Autowired`就相当于把指定类型的Bean注入到指定的字段中。和XML配置相比，`@Autowired`大幅简化了注入，因为它不但可以写在`set()`方法上，还可以直接写在字段上，甚至可以写在构造方法中：

```java
@Component
public class UserService {
    MailService mailService;

    public UserService(@Autowired MailService mailService) {
        this.mailService = mailService;
    }
    ...
}
```



我们一般把`@Autowired`写在字段上，通常使用package权限的字段，便于测试。

最后，编写一个`AppConfig`类启动容器：

```java
@Configuration
@ComponentScan
public class AppConfig {
    public static void main(String[] args) {
        ApplicationContext context = new AnnotationConfigApplicationContext(AppConfig.class);
        UserService userService = context.getBean(UserService.class);
        User user = userService.login("bob@example.com", "password");
        System.out.println(user.getName());
    }
}
```



除了`main()`方法外，`AppConfig`标注了`@Configuration`，表示它是一个配置类，因为我们创建`ApplicationContext`时：

```java
ApplicationContext context = new AnnotationConfigApplicationContext(AppConfig.class);
```



使用的实现类是`AnnotationConfigApplicationContext`，必须传入一个标注了`@Configuration`的类名。

此外，`AppConfig`还标注了`@ComponentScan`，它告诉容器，自动搜索当前类所在的包以及子包，把所有标注为`@Component`的Bean自动创建出来，并根据`@Autowired`进行装配。

使用Annotation配合自动扫描能大幅简化Spring的配置，我们只需要保证：

- 每个Bean被标注为`@Component`并正确使用`@Autowired`注入；
- 配置类被标注为`@Configuration`和`@ComponentScan`；
- 所有Bean均在指定包以及子包内。

使用`@ComponentScan`非常方便，但是，我们也要特别注意包的层次结构。通常来说，启动配置`AppConfig`位于自定义的顶层包（例如`com.itranswarp.learnjava`），其他Bean按类别放入子包。

###### 上述例子为copy，本人@componentScan理解依托，就不献丑了

> 参考文献：
> [Jdk17官方文档]: https://doc.qzxdp.cn/jdk/17/zh/api/index.html
> [spring官方文档]: https://spring.io/docs
> [廖雪峰java文档]: https://liaoxuefeng.com/books/java/spring/ioc/annotation-config/index.html
>
> 




