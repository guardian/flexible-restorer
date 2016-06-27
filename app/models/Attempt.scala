package models

import org.slf4j.Logger
import play.api.mvc.Result

import scala.concurrent.{ExecutionContext, Future}


case class Attempt[A] private (underlying: Future[Either[AttemptErrors, A]]) {
  def map[B](f: A => B)(implicit ec: ExecutionContext): Attempt[B] =
    flatMap(a => Attempt.Right(f(a)))

  def flatMap[B](f: A => Attempt[B])(implicit ec: ExecutionContext): Attempt[B] = Attempt {
    asFuture.flatMap {
      case Right(a) => f(a).asFuture
      case Left(e) => Future.successful(Left(e))
    }
  }

  def fold[B](failure: AttemptErrors => B, success: A => B)(implicit ec: ExecutionContext): Future[B] = {
    asFuture.map(_.fold(failure, success))
  }

  def foreach(f: A => Unit)(implicit ec: ExecutionContext): Unit = map(f)

  /**
    * If there is an error in the Future itself (e.g. a timeout) we convert it to a
    * Left so we have a consistent error representation. This would likely have
    * logging around it, or you may have an error representation that carries more info
    * for these kinds of issues.
    */
  def asFuture(implicit ec: ExecutionContext): Future[Either[AttemptErrors, A]] = {
    underlying recover { case err =>
      val apiErrors = AttemptErrors(AttemptError(err.getMessage, throwable = Some(err)))
      scala.Left(apiErrors)
    }
  }
}

object Attempt {
  /**
    * As with `Future.sequence`, changes `List[Attempt[A]]` to `Attempt[List[A]]`.
    *
    * This implementation takes the first failure for simplicity, it's possible
    * to collect all the failures when that's required.
    */
  def sequence[A](responses: Seq[Attempt[A]])(implicit ec: ExecutionContext): Attempt[Seq[A]] = Attempt {
    Future.sequence(responses.map(_.underlying)).map { eithers =>
      eithers
        .collectFirst { case scala.Left(x) => scala.Left(x): Either[AttemptErrors, Seq[A]]}
        .getOrElse {
          scala.Right(eithers collect { case Right(x) => x})
        }
    }
  }

  /**
    * Sequence this attempt as a successful attempt that contains a list of potential
    * failures. This is useful if failure is acceptable in part of the application.
    */
  def sequenceFutures[A](response: List[Attempt[A]])(implicit ec: ExecutionContext): Attempt[List[Either[AttemptErrors, A]]] = {
    Async.Right(Future.sequence(response.map(_.asFuture)))
  }

  def fromEither[A](e: Either[AttemptErrors, A]): Attempt[A] =
    Attempt(Future.successful(e))

  /**
    * Convert a plain `Future` value to an attempt by providing a recovery handler.
    */
  def fromFuture[A](future: Future[Either[AttemptErrors, A]])(recovery: PartialFunction[Throwable, Either[AttemptErrors, A]])(implicit ec: ExecutionContext): Attempt[A] = {
    Attempt(future recover recovery)
  }

  /**
    * Discard failures from a list of attempts.
    *
    * **Use with caution**.
    */
  def successfulAttempts[A](attempts: Seq[Attempt[A]])(implicit ec: ExecutionContext): Attempt[Seq[A]] = {
    Attempt.Async.Right {
      Future.sequence(attempts.map { attempt =>
        attempt.fold(_ => None, a => Some(a))
      }).map(_.flatten)
    }
  }

  /**
    * Create an Attempt instance from a "good" value.
    */
  def Right[A](a: A): Attempt[A] =
    Attempt(Future.successful(scala.Right(a)))

  /**
    * Create an Attempt failure from an AMIableErrors instance.
    */
  def Left[A](err: AttemptErrors): Attempt[A] =
    Attempt(Future.successful(scala.Left(err)))

  def Left[A](err: AttemptError): Attempt[A] =
    Attempt(Future.successful(scala.Left(AttemptErrors(err))))

  /**
    * Asyncronous versions of the Attempt Right/Left helpers for when you have
    * a Future that returns a good/bad value directly.
    */
  object Async {
    /**
      * Create an Attempt from a Future of a good value.
      */
    def Right[A](fa: Future[A])(implicit ec: ExecutionContext): Attempt[A] =
      Attempt(fa.map(scala.Right(_)))

    /**
      * Create an Attempt from a known failure in the future. For example,
      * if a piece of logic fails but you need to make a Database/API call to
      * get the failure information.
      */
    def Left[A](ferr: Future[AttemptErrors])(implicit ec: ExecutionContext): Attempt[A] =
      Attempt(ferr.map(scala.Left(_)))
  }

  def apply[A](action: => Attempt[Result])(errorHandler: AttemptErrors => Result)(implicit ec: ExecutionContext) = {
    action.fold(
      errorHandler,
      identity
    )
  }
}

case class AttemptError(message: String, context: Option[String] = None, throwable: Option[Throwable] = None) {
  lazy val logString = s"${context.fold("")(_+": ")}$message"
  def logTo(logger: Logger): Unit = {
    throwable match {
      case None => logger.error(logString)
      case Some(t) => logger.error(logString, t)
    }
  }
}

case class AttemptErrors(errors: List[AttemptError])

object AttemptErrors {
  def apply(error: AttemptError): AttemptErrors = {
    AttemptErrors(List(error))
  }
  def apply(errors: Seq[AttemptError]): AttemptErrors = {
    AttemptErrors(errors.toList)
  }
}
